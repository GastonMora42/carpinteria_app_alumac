// src/app/api/ventas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const ventaUpdateSchema = z.object({
  estado: z.enum([
    'BORRADOR',
    'PENDIENTE', 
    'CONFIRMADO',
    'EN_PROCESO',
    'EN_PRODUCCION',
    'LISTO_ENTREGA',
    'ENTREGADO',
    'FACTURADO',
    'COBRADO',
    'CANCELADO'
  ]).optional(),
  porcentajeAvance: z.number().min(0).max(100).optional(),
  fechaEntregaReal: z.date().optional(),
  observaciones: z.string().optional()
});

// GET - Obtener venta por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { 
            id: true, 
            codigo: true,
            nombre: true, 
            email: true, 
            telefono: true 
          }
        },
        presupuesto: {
          select: { 
            id: true, 
            numero: true,
            items: true
          }
        },
        user: {
          select: { id: true, name: true }
        },
        materiales: {
          include: {
            material: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                unidadMedida: true
              }
            }
          }
        },
        transacciones: {
          include: {
            medioPago: {
              select: { nombre: true }
            }
          },
          orderBy: { fecha: 'desc' }
        },
        gastos: true
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);
  } catch (error: any) {
    console.error('Error al obtener venta:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener venta' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar venta
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
    const validatedData = ventaUpdateSchema.parse(body);
    
    // Verificar que la venta existe
    const existingPedido = await prisma.pedido.findUnique({
      where: { id },
      select: { userId: true, estado: true }
    });
    
    if (!existingPedido) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar permisos
    if (existingPedido.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta venta' },
        { status: 403 }
      );
    }
    
    const pedido = await prisma.pedido.update({
      where: { id },
      data: validatedData,
      include: {
        cliente: {
          select: { 
            id: true, 
            nombre: true, 
            email: true, 
            telefono: true 
          }
        },
        presupuesto: {
          select: { id: true, numero: true }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });
    
    return NextResponse.json(pedido);
  } catch (error: any) {
    console.error('Error al actualizar venta:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar venta' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar venta
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    const existingPedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        transacciones: true,
        materiales: true
      }
    });
    
    if (!existingPedido) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar permisos
    if (existingPedido.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta venta' },
        { status: 403 }
      );
    }
    
    // Verificar que no tenga transacciones o materiales asociados
    if (existingPedido.transacciones.length > 0 || existingPedido.materiales.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una venta con transacciones o materiales asociados' },
        { status: 400 }
      );
    }
    
    await prisma.pedido.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: 'Venta eliminada correctamente',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar venta' },
      { status: 500 }
    );
  }
}