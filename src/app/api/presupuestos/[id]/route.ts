// ===================================

// src/app/api/presupuestos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { presupuestoUpdateSchema } from '@/lib/validations/presupuesto';
import { verifyAuth } from '@/lib/auth/verify';

// GET - Obtener presupuesto por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('token')?.value;
    await verifyAuth(token);
    
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          orderBy: { orden: 'asc' }
        },
        pedido: {
          select: { id: true, numero: true, estado: true }
        }
      }
    });

    if (!presupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(presupuesto);
  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuesto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar presupuesto
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('token')?.value;
    const user = await verifyAuth(token);
    
    const body = await req.json();
    const validatedData = presupuestoUpdateSchema.parse(body);
    
    // Verificar que existe y que el estado permite edición
    const existingPresupuesto = await prisma.presupuesto.findUnique({
      where: { id: params.id }
    });
    
    if (!existingPresupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }
    
    if (existingPresupuesto.estado === 'CONVERTIDO') {
      return NextResponse.json(
        { error: 'No se puede editar un presupuesto ya convertido' },
        { status: 400 }
      );
    }
    
    const presupuesto = await prisma.presupuesto.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        cliente: true,
        items: true
      }
    });
    
    return NextResponse.json(presupuesto);
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar presupuesto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar presupuesto
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('token')?.value;
    await verifyAuth(token);
    
    const existingPresupuesto = await prisma.presupuesto.findUnique({
      where: { id: params.id },
      include: { pedido: true }
    });
    
    if (!existingPresupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }
    
    if (existingPresupuesto.pedido) {
      return NextResponse.json(
        { error: 'No se puede eliminar un presupuesto con pedido asociado' },
        { status: 400 }
      );
    }
    
    await prisma.presupuesto.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar presupuesto' },
      { status: 500 }
    );
  }
}

