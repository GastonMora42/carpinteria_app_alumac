// ============================================================================

// src/app/api/transacciones/route.ts - ACTUALIZADO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transaccionSchema } from '@/lib/validations/transaccion';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tipo = searchParams.get('tipo');
    const clienteId = searchParams.get('clienteId');
    const pedidoId = searchParams.get('pedidoId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (clienteId) {
      where.clienteId = clienteId;
    }
    
    if (pedidoId) {
      where.pedidoId = pedidoId;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fecha.lte = new Date(fechaHasta);
      }
    }

    const [transacciones, total] = await Promise.all([
      prisma.transaccion.findMany({
        where,
        include: {
          cliente: {
            select: { id: true, nombre: true }
          },
          proveedor: {
            select: { id: true, nombre: true }
          },
          pedido: {
            select: { id: true, numero: true }
          },
          medioPago: {
            select: { id: true, nombre: true }
          },
          user: {
            select: { id: true, name: true }
          },
          cheque: true
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaccion.count({ where })
    ]);

    return NextResponse.json({
      data: transacciones,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error al obtener transacciones:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = transaccionSchema.parse(body);
    
    // Generar número único
    const count = await prisma.transaccion.count();
    const numero = `TRX-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const result = await prisma.$transaction(async (tx: {
        transaccion: {
          create: (arg0: {
            data: {
              numero: string; tipo: "INGRESO" | "EGRESO" | "ANTICIPO" | "PAGO_OBRA" | "PAGO_PROVEEDOR" | "GASTO_GENERAL" | "TRANSFERENCIA" | "AJUSTE"; concepto: string; descripcion: string | undefined; monto: number; moneda: "PESOS" | "DOLARES"; cotizacion: number | undefined; fecha: Date; fechaVencimiento: Date | undefined; numeroComprobante: string | undefined; tipoComprobante: string | undefined; clienteId: string | undefined; proveedorId: string | undefined; pedidoId: string | undefined; medioPagoId: string; userId: string; // Usar ID del usuario autenticado
            }; include: { cliente: boolean; proveedor: boolean; pedido: boolean; medioPago: boolean; };
          }) => any;
        }; pedido: { findUnique: (arg0: { where: { id: string; }; }) => any; update: (arg0: { where: { id: string; }; data: { totalCobrado: any; saldoPendiente: number; estado: any; }; }) => any; };
      }) => {
      // Crear transacción
      const transaccion = await tx.transaccion.create({
        data: {
          numero,
          tipo: validatedData.tipo,
          concepto: validatedData.concepto,
          descripcion: validatedData.descripcion,
          monto: validatedData.monto,
          moneda: validatedData.moneda,
          cotizacion: validatedData.cotizacion,
          fecha: validatedData.fecha,
          fechaVencimiento: validatedData.fechaVencimiento,
          numeroComprobante: validatedData.numeroComprobante,
          tipoComprobante: validatedData.tipoComprobante,
          clienteId: validatedData.clienteId,
          proveedorId: validatedData.proveedorId,
          pedidoId: validatedData.pedidoId,
          medioPagoId: validatedData.medioPagoId,
          userId: user.id // Usar ID del usuario autenticado
        },
        include: {
          cliente: true,
          proveedor: true,
          pedido: true,
          medioPago: true
        }
      });
      
      // Si es un pago relacionado a un pedido, actualizar saldos
      if (validatedData.pedidoId && (validatedData.tipo === 'INGRESO' || validatedData.tipo === 'ANTICIPO' || validatedData.tipo === 'PAGO_OBRA')) {
        const pedido = await tx.pedido.findUnique({
          where: { id: validatedData.pedidoId }
        });
        
        if (pedido) {
          const nuevoTotalCobrado = pedido.totalCobrado.toNumber() + validatedData.monto;
          const nuevoSaldoPendiente = pedido.total.toNumber() - nuevoTotalCobrado;
          
          await tx.pedido.update({
            where: { id: validatedData.pedidoId },
            data: {
              totalCobrado: nuevoTotalCobrado,
              saldoPendiente: nuevoSaldoPendiente,
              estado: nuevoSaldoPendiente <= 0 ? 'COBRADO' : pedido.estado
            }
          });
        }
      }
      
      return transaccion;
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear transacción:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear transacción' },
      { status: 500 }
    );
  }
}

