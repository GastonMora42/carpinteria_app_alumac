// src/app/api/compras-materiales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { compraMaterialSchema } from '@/lib/validations/compra-material';
import { DocumentNumbering } from '@/lib/utils/numbering';
import { z } from 'zod';

// GET - Listar compras de materiales
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const materialId = searchParams.get('materialId');
    const proveedorId = searchParams.get('proveedorId');
    const ventaId = searchParams.get('ventaId');
    const estadoPago = searchParams.get('estadoPago');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (materialId) where.materialId = materialId;
    if (proveedorId) where.proveedorId = proveedorId;
    if (ventaId) where.ventaId = ventaId;
    if (estadoPago) where.estadoPago = estadoPago;
    
    if (fechaDesde || fechaHasta) {
      where.fechaCompra = {};
      if (fechaDesde) where.fechaCompra.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaCompra.lte = new Date(fechaHasta + 'T23:59:59');
    }

    const [compras, total] = await Promise.all([
      prisma.compraMaterial.findMany({
        where,
        include: {
          material: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              unidadMedida: true
            }
          },
          proveedor: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true
            }
          },
          venta: {
            select: {
              id: true,
              numero: true,
              cliente: {
                select: { nombre: true }
              }
            }
          },
          medioPago: {
            select: {
              id: true,
              nombre: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { fechaCompra: 'desc' },
        skip,
        take: limit
      }),
      prisma.compraMaterial.count({ where })
    ]);

    return NextResponse.json({
      data: compras,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error al obtener compras de materiales:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener compras de materiales' },
      { status: 500 }
    );
  }
}

// POST - Crear compra de material
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = compraMaterialSchema.parse(body);
    
    // Verificar que el material existe
    const material = await prisma.material.findUnique({
      where: { id: validatedData.materialId },
      include: { proveedor: true }
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Material no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: validatedData.proveedorId }
    });
    
    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar medio de pago
    const medioPago = await prisma.medioPago.findUnique({
      where: { id: validatedData.medioPagoId }
    });
    
    if (!medioPago) {
      return NextResponse.json(
        { error: 'Medio de pago no encontrado' },
        { status: 404 }
      );
    }

    // Si se especifica ventaId, verificar que existe
    if (validatedData.ventaId) {
      const venta = await prisma.pedido.findUnique({
        where: { id: validatedData.ventaId }
      });
      
      if (!venta) {
        return NextResponse.json(
          { error: 'Venta no encontrada' },
          { status: 404 }
        );
      }
    }

    // Generar número único para la compra
    const numeroCompra = await generateCompraNumber();
    
    // Calcular totales
    const subtotal = Number(validatedData.cantidad) * Number(validatedData.precioUnitario);
    const montoImpuestos = (subtotal * Number(validatedData.impuestos || 0)) / 100;
    const total = subtotal + montoImpuestos;

    // Crear la compra en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la compra
      const compra = await tx.compraMaterial.create({
        data: {
          numero: numeroCompra,
          materialId: validatedData.materialId,
          proveedorId: validatedData.proveedorId,
          ventaId: validatedData.ventaId,
          cantidad: validatedData.cantidad,
          precioUnitario: validatedData.precioUnitario,
          subtotal,
          impuestos: montoImpuestos,
          total,
          moneda: validatedData.moneda,
          numeroFactura: validatedData.numeroFactura,
          cuitProveedor: validatedData.cuitProveedor,
          fechaCompra: validatedData.fechaCompra,
          fechaPago: validatedData.fechaPago,
          fechaVencimiento: validatedData.fechaVencimiento,
          medioPagoId: validatedData.medioPagoId,
          estadoPago: validatedData.estadoPago,
          observaciones: validatedData.observaciones,
          archivoFactura: validatedData.archivoFactura,
          userId: user.id
        },
        include: {
          material: true,
          proveedor: true,
          venta: { include: { cliente: true } },
          medioPago: true,
          user: { select: { name: true } }
        }
      });

      // 2. Crear movimiento de inventario (entrada)
      const movimiento = await tx.movimientoInventario.create({
        data: {
          materialId: validatedData.materialId,
          tipo: 'ENTRADA',
          cantidad: validatedData.cantidad,
          stockAnterior: material.stockActual,
          stockNuevo: Number(material.stockActual) + Number(validatedData.cantidad),
          motivo: `Compra - Factura ${validatedData.numeroFactura}`,
          referencia: numeroCompra,
          fecha: validatedData.fechaCompra,
          userId: user.id
        }
      });

      // 3. Actualizar stock del material
      await tx.material.update({
        where: { id: validatedData.materialId },
        data: { 
          stockActual: Number(material.stockActual) + Number(validatedData.cantidad),
          // Actualizar precio si es diferente
          ...(validatedData.precioUnitario !== Number(material.precioUnitario) && {
            precioUnitario: validatedData.precioUnitario
          })
        }
      });

      // 4. Crear transacción contable
      const transaccionNumero = await DocumentNumbering.generateTransaccionNumber();
      const transaccion = await tx.transaccion.create({
        data: {
          numero: transaccionNumero,
          tipo: 'PAGO_PROVEEDOR',
          concepto: `Compra de material: ${material.nombre}`,
          descripcion: `Factura ${validatedData.numeroFactura} - ${proveedor.nombre}`,
          monto: total,
          moneda: validatedData.moneda,
          fecha: validatedData.fechaCompra,
          fechaVencimiento: validatedData.fechaVencimiento,
          numeroComprobante: validatedData.numeroFactura,
          tipoComprobante: 'FACTURA',
          proveedorId: validatedData.proveedorId,
          medioPagoId: validatedData.medioPagoId,
          userId: user.id
        }
      });

      return { compra, movimiento, transaccion };
    });

    console.log(`✅ Compra de material creada: ${result.compra.numero}`);
    console.log(`📦 Stock actualizado: ${material.nombre} (+${validatedData.cantidad})`);
    console.log(`💰 Transacción registrada: ${result.transaccion.numero}`);

    return NextResponse.json(result.compra, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear compra de material:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (error.errors) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear compra de material' },
      { status: 500 }
    );
  }
}

// Función auxiliar para generar número de compra
async function generateCompraNumber(): Promise<string> {
  const count = await prisma.compraMaterial.count();
  const year = new Date().getFullYear();
  return `COMP-${year}-${String(count + 1).padStart(4, '0')}`;
}