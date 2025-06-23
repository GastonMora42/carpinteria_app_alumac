// src/app/api/proveedores/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const proveedorUpdateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  activo: z.boolean().optional()
});

// GET - Obtener proveedor por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        materiales: {
          where: { activo: true },
          orderBy: { nombre: 'asc' },
          take: 20
        },
        _count: {
          select: { materiales: true }
        }
      }
    });

    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(proveedor);
  } catch (error: any) {
    console.error('Error al obtener proveedor:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener proveedor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar proveedor
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
    const validatedData = proveedorUpdateSchema.parse(body);
    
    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { materiales: true }
        }
      }
    });
    
    return NextResponse.json(proveedor);
  } catch (error: any) {
    console.error('Error al actualizar proveedor:', error);
    
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
      { error: 'Error al actualizar proveedor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar proveedor
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    // Verificar si tiene materiales asociados
    const materialesCount = await prisma.material.count({
      where: { proveedorId: id, activo: true }
    });
    
    if (materialesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un proveedor con materiales asociados' },
        { status: 400 }
      );
    }
    
    await prisma.proveedor.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: 'Proveedor eliminado correctamente',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('Error al eliminar proveedor:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    );
  }
}