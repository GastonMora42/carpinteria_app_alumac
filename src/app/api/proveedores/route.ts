// src/app/api/proveedores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { proveedorSchema } from '@/lib/validations/material';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// GET - Listar proveedores
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    
    const where: any = {
      activo: true
    };
    
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const proveedores = await prisma.proveedor.findMany({
      where,
      include: {
        _count: {
          select: { materiales: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    
    return NextResponse.json({
      data: proveedores,
      pagination: {
        total: proveedores.length,
        pages: 1,
        page: 1,
        limit: proveedores.length
      }
    });
  } catch (error: any) {
    console.error('Error al obtener proveedores:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

// POST - Crear proveedor
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = proveedorSchema.parse(body);
    
    // Generar código único
    const count = await prisma.proveedor.count();
    const codigo = `PROV-${String(count + 1).padStart(3, '0')}`;
    
    const proveedor = await prisma.proveedor.create({
      data: {
        codigo,
        ...validatedData
      },
      include: {
        _count: {
          select: { materiales: true }
        }
      }
    });
    
    return NextResponse.json(proveedor, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear proveedor:', error);
    
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
      { error: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}