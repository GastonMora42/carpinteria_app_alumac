// src/app/api/presupuestos/route.ts - CORREGIDO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { presupuestoSchema } from '@/lib/validations/presupuesto';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { CalculationUtils } from '@/lib/utils/calculations';

// GET - Listar presupuestos con filtros
export async function GET(req: NextRequest) {
  try {
    // CORREGIDO: Usar verifyCognitoAuth en lugar de verifyAuth
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const where: any = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (clienteId) {
      where.clienteId = clienteId;
    }
    
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { descripcionObra: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [presupuestos, total] = await Promise.all([
      prisma.presupuesto.findMany({
        where,
        include: {
          cliente: {
            select: { id: true, nombre: true, email: true, telefono: true }
          },
          user: {
            select: { id: true, name: true }
          },
          items: true,
          _count: {
            select: { items: true }
          }
        },
        orderBy: { fechaEmision: 'desc' },
        skip,
        take: limit
      }),
      prisma.presupuesto.count({ where })
    ]);

    return NextResponse.json({
      data: presupuestos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error al obtener presupuestos:', error);
    
    // Manejar errores de autenticación
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo presupuesto
export async function POST(req: NextRequest) {
  try {
    // CORREGIDO: Usar verifyCognitoAuth en lugar de verifyAuth
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = presupuestoSchema.parse(body);
    
    // Generar número único
    const count = await prisma.presupuesto.count();
    const numero = `PRES-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    // Calcular totales usando la utilidad
    const totales = CalculationUtils.calculateOrderTotals(
      validatedData.items,
      validatedData.descuento,
      validatedData.impuestos
    );
    
    const presupuesto = await prisma.presupuesto.create({
      data: {
        numero,
        clienteId: validatedData.clienteId,
        fechaValidez: validatedData.fechaValidez,
        descripcionObra: validatedData.descripcionObra,
        observaciones: validatedData.observaciones,
        condicionesPago: validatedData.condicionesPago,
        tiempoEntrega: validatedData.tiempoEntrega,
        validezDias: validatedData.validezDias,
        subtotal: totales.subtotal,
        descuento: validatedData.descuento,
        impuestos: validatedData.impuestos,
        total: totales.total,
        moneda: validatedData.moneda,
        userId: user.id,
        items: {
          create: validatedData.items.map((item, index) => ({
            orden: index + 1,
            descripcion: item.descripcion,
            detalle: item.detalle,
            cantidad: item.cantidad,
            unidad: item.unidad,
            precioUnitario: item.precioUnitario,
            descuento: item.descuento,
            total: CalculationUtils.calculateItemTotal(
              item.cantidad, 
              item.precioUnitario, 
              item.descuento
            )
          }))
        }
      },
      include: {
        cliente: true,
        items: true
      }
    });
    
    return NextResponse.json(presupuesto, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear presupuesto:', error);
    
    // Manejar errores de autenticación
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
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}