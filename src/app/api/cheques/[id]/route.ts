// src/app/api/cheques/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const chequeUpdateSchema = z.object({
  estado: z.enum(['CARTERA', 'DEPOSITADO', 'COBRADO', 'RECHAZADO', 'ANULADO', 'ENDOSADO']).optional(),
  fechaCobro: z.string().transform(str => new Date(str)).optional(),
  motivoRechazo: z.string().optional()
});

// GET - Obtener cheque por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    const cheque = await prisma.cheque.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { 
            id: true, 
            nombre: true, 
            email: true,
            telefono: true 
          }
        },
        transaccion: {
          select: { 
            id: true, 
            numero: true, 
            concepto: true,
            fecha: true,
            monto: true
          }
        }
      }
    });

    if (!cheque) {
      return NextResponse.json(
        { error: 'Cheque no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cheque);
  } catch (error: any) {
    console.error('Error al obtener cheque:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener cheque' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado del cheque
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
    const validatedData = chequeUpdateSchema.parse(body);
    
    const cheque = await prisma.cheque.update({
      where: { id },
      data: validatedData,
      include: {
        cliente: {
          select: { 
            id: true, 
            nombre: true, 
            telefono: true 
          }
        },
        transaccion: {
          select: { 
            id: true, 
            numero: true, 
            concepto: true 
          }
        }
      }
    });
    
    return NextResponse.json(cheque);
  } catch (error: any) {
    console.error('Error al actualizar cheque:', error);
    
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
      { error: 'Error al actualizar cheque' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cheque
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    const existingCheque = await prisma.cheque.findUnique({
      where: { id }
    });
    
    if (!existingCheque) {
      return NextResponse.json(
        { error: 'Cheque no encontrado' },
        { status: 404 }
      );
    }
    
    if (existingCheque.estado === 'COBRADO') {
      return NextResponse.json(
        { error: 'No se puede eliminar un cheque cobrado' },
        { status: 400 }
      );
    }
    
    await prisma.cheque.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      message: 'Cheque eliminado correctamente',
      deletedId: id 
    });
  } catch (error: any) {
    console.error('Error al eliminar cheque:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar cheque' },
      { status: 500 }
    );
  }
}