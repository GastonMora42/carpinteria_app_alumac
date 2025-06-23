// src/app/api/cheques/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const chequeSchema = z.object({
  numero: z.string().min(1, "El número de cheque es requerido"),
  banco: z.string().min(1, "El banco es requerido"),
  sucursal: z.string().optional(),
  cuit: z.string().optional(),
  fechaEmision: z.string().transform(str => new Date(str)),
  fechaVencimiento: z.string().transform(str => new Date(str)),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.enum(['PESOS', 'DOLARES']).default('PESOS'),
  clienteId: z.string().optional(),
  transaccionId: z.string().optional()
});

// GET - Listar cheques
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    
    const where: any = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (clienteId) {
      where.clienteId = clienteId;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fechaVencimiento = {};
      if (fechaDesde) {
        where.fechaVencimiento.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fechaVencimiento.lte = new Date(fechaHasta);
      }
    }

    const cheques = await prisma.cheque.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true, telefono: true }
        },
        transaccion: {
          select: { id: true, numero: true, concepto: true }
        }
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    return NextResponse.json({
      data: cheques,
      pagination: {
        total: cheques.length,
        pages: 1,
        page: 1,
        limit: cheques.length
      }
    });
  } catch (error: any) {
    console.error('Error al obtener cheques:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener cheques' },
      { status: 500 }
    );
  }
}

// POST - Crear cheque
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = chequeSchema.parse(body);
    
    const cheque = await prisma.cheque.create({
      data: {
        ...validatedData,
        estado: 'CARTERA'
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, telefono: true }
        },
        transaccion: {
          select: { id: true, numero: true, concepto: true }
        }
      }
    });
    
    return NextResponse.json(cheque, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear cheque:', error);
    
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
      { error: 'Error al crear cheque' },
      { status: 500 }
    );
  }
}