// ===================================
// src/app/api/clientes/[id]/route.ts - CORREGIDO PARA NEXT.JS 15
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// Schema de validación
const clienteUpdateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  cuit: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

// GET - Obtener un cliente por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await verifyCognitoAuth(req);
    
    // Obtener parámetros (async en Next.js 15)
    const { id } = await params;
    
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        presupuestos: {
          orderBy: { fechaEmision: 'desc' },
          take: 5,
        },
        pedidos: {
          orderBy: { fechaPedido: 'desc' },
          take: 5,
        },
        transacciones: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Error al obtener cliente:', error);
    
    // Manejar errores de autenticación
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un cliente
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
    
    // Validar datos
    const validatedData = clienteUpdateSchema.parse(body);
    
    // Actualizar cliente
    const cliente = await prisma.cliente.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    // Manejar errores de autenticación
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un cliente
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await verifyCognitoAuth(req);
    
    // Obtener parámetros (async en Next.js 15)
    const { id } = await params;
    
    await prisma.cliente.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Cliente eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    
    // Manejar errores de autenticación
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}

