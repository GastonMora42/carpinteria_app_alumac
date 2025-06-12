// ============================================================================

// src/app/api/clientes/route.ts - ACTUALIZADO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { clienteSchema } from '@/lib/validations/client';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
    
    return NextResponse.json({
      data: clientes,
      pagination: {
        total: clientes.length,
        pages: 1,
        page: 1,
        limit: clientes.length
      }
    });
  } catch (error: any) {
    console.error('Error al obtener clientes:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = clienteSchema.parse(body);
    
    // Generar código único
    const count = await prisma.cliente.count();
    const codigo = `CLI-${String(count + 1).padStart(3, '0')}`;
    
    const cliente = await prisma.cliente.create({
      data: {
        codigo,
        ...validatedData,
      },
    });
    
    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear cliente:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (error.errors) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}