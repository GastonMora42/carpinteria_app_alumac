// src/app/api/presupuestos/[id]/route.ts - CORREGIDO TIPOS PRISMA
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

// Schema específico para actualización - SOLO campos simples
const presupuestoUpdateSchema = z.object({
  fechaValidez: z.date().optional(),
  descripcionObra: z.string()
    .min(1, "La descripción de la obra es requerida")
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  observaciones: z.string()
    .max(1000, "Las observaciones no pueden exceder 1000 caracteres")
    .optional(),
  condicionesPago: z.string()
    .max(500, "Las condiciones de pago no pueden exceder 500 caracteres")
    .optional(),
  tiempoEntrega: z.string()
    .max(100, "El tiempo de entrega no puede exceder 100 caracteres")
    .optional(),
  validezDias: z.number()
    .min(1, "La validez debe ser al menos 1 día")
    .max(365, "La validez no puede exceder 365 días")
    .optional(),
  descuento: z.number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100%")
    .optional(),
  impuestos: z.number()
    .min(0, "Los impuestos no pueden ser negativos")
    .max(100, "Los impuestos no pueden ser mayor a 100%")
    .optional(),
  estado: z.enum(['BORRADOR', 'PENDIENTE', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO'])
    .optional()
});

// GET - Obtener presupuesto por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await verifyCognitoAuth(req);
    
    // Obtener parámetros (async en Next.js 15)
    const { id } = await params;
    
    const presupuesto = await prisma.presupuesto.findUnique({
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
  } catch (error: any) {
    console.error('Error al obtener presupuesto:', error);
    
    // Manejar errores de autenticación
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener presupuesto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar presupuesto
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await verifyCognitoAuth(req);
    
    // Obtener parámetros (async en Next.js 15)
    const { id } = await params;
    
    const body = await req.json();
    console.log('📝 Datos recibidos para actualizar:', body);
    
    // Validar datos - SOLO campos simples
    const validatedData = presupuestoUpdateSchema.parse(body);
    console.log('✅ Datos validados:', validatedData);
    
    // Verificar que existe y que el estado permite edición
    const existingPresupuesto = await prisma.presupuesto.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        userId: true
      }
    });
    
    if (!existingPresupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar que el usuario puede editar este presupuesto
    if (existingPresupuesto.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este presupuesto' },
        { status: 403 }
      );
    }
    
    if (existingPresupuesto.estado === 'CONVERTIDO') {
      return NextResponse.json(
        { error: 'No se puede editar un presupuesto ya convertido' },
        { status: 400 }
      );
    }
    
    // Actualizar solo campos simples
    const presupuesto = await prisma.presupuesto.update({
      where: { id },
      data: validatedData,
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
        items: {
          orderBy: { orden: 'asc' }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    console.log('✅ Presupuesto actualizado:', presupuesto.id);
    
    return NextResponse.json(presupuesto);
  } catch (error: any) {
    console.error('❌ Error al actualizar presupuesto:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    // Manejar errores de autenticación
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar presupuesto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar presupuesto
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await verifyCognitoAuth(req);
    
    // Obtener parámetros (async en Next.js 15)
    const { id } = await params;
    
    const existingPresupuesto = await prisma.presupuesto.findUnique({
      where: { id },
      include: { 
        pedido: {
          select: { id: true, numero: true }
        }
      }
    });
    
    if (!existingPresupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar que el usuario puede eliminar este presupuesto
    if (existingPresupuesto.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este presupuesto' },
        { status: 403 }
      );
    }
    
    if (existingPresupuesto.pedido) {
      return NextResponse.json(
        { error: 'No se puede eliminar un presupuesto con pedido asociado' },
        { status: 400 }
      );
    }
    
    // Eliminar presupuesto y sus items (cascade)
    await prisma.presupuesto.delete({
      where: { id }
    });
    
    console.log('✅ Presupuesto eliminado:', id);
    
    return NextResponse.json({ 
      message: 'Presupuesto eliminado correctamente',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('❌ Error al eliminar presupuesto:', error);
    
    // Manejar errores de autenticación
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Error de constraint (relaciones existentes)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar el presupuesto porque tiene elementos relacionados' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar presupuesto' },
      { status: 500 }
    );
  }
}