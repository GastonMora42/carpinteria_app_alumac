// ===================================

// src/app/api/ventas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ventaSchema } from '@/lib/validations/venta';
import { verifyAuth } from '@/lib/auth/verify';

// GET - Listar ventas/pedidos
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    await verifyAuth(token);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
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

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          cliente: {
            select: { id: true, nombre: true, email: true, telefono: true }
          },
          presupuesto: {
            select: { id: true, numero: true }
          },
          user: {
            select: { id: true, name: true }
          },
          _count: {
            select: { 
              transacciones: true,
              materiales: true 
            }
          }
        },
        orderBy: { fechaPedido: 'desc' },
        skip,
        take: limit
      }),
      prisma.pedido.count({ where })
    ]);

    return NextResponse.json({
      data: pedidos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva venta
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const user = await verifyAuth(token);
    
    const body = await req.json();
    const validatedData = ventaSchema.parse(body);
    
    // Generar número único
    const count = await prisma.pedido.count();
    const numero = `VEN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    // Si viene de presupuesto, obtener datos
    let presupuestoData = null;
    if (validatedData.presupuestoId) {
      presupuestoData = await prisma.presupuesto.findUnique({
        where: { id: validatedData.presupuestoId },
        include: { items: true }
      });
    }
    
    const pedido = await prisma.pedido.create({
      data: {
        numero,
        clienteId: validatedData.clienteId,
        presupuestoId: validatedData.presupuestoId,
        fechaEntrega: validatedData.fechaEntrega,
        prioridad: validatedData.prioridad,
        descripcionObra: validatedData.descripcionObra,
        observaciones: validatedData.observaciones,
        condicionesPago: validatedData.condicionesPago,
        lugarEntrega: validatedData.lugarEntrega,
        subtotal: presupuestoData?.subtotal || 0,
        descuento: validatedData.descuento,
        impuestos: validatedData.impuestos,
        total: presupuestoData?.total || 0,
        saldoPendiente: presupuestoData?.total || 0,
        moneda: validatedData.moneda,
        userId: user.id
      },
      include: {
        cliente: true,
        presupuesto: true
      }
    });
    
    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error('Error al crear venta:', error);
    return NextResponse.json(
      { error: 'Error al crear venta' },
      { status: 500 }
    );
  }
}

