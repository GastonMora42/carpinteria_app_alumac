// src/app/api/materiales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { materialSchema } from '@/lib/validations/material';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// GET - Listar materiales
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tipo = searchParams.get('tipo');
    const proveedorId = searchParams.get('proveedorId');
    const search = searchParams.get('search');
    const stockFilter = searchParams.get('stockFilter');
    
    const skip = (page - 1) * limit;
    
    const where: any = {
      activo: true
    };
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (proveedorId) {
      where.proveedorId = proveedorId;
    }
    
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    let materials = await prisma.material.findMany({
      where,
      include: {
        proveedor: {
          select: { id: true, nombre: true, telefono: true }
        }
      },
      orderBy: { nombre: 'asc' },
      skip,
      take: limit
    });

    // Filtro de stock en memoria (podría optimizarse con SQL)
    if (stockFilter) {
      materials = materials.filter(material => {
        const stockActual = Number(material.stockActual);
        const stockMinimo = Number(material.stockMinimo);
        
        switch (stockFilter) {
          case 'critico':
            return stockActual <= stockMinimo;
          case 'bajo':
            return stockActual <= stockMinimo * 1.5 && stockActual > stockMinimo;
          case 'normal':
            return stockActual > stockMinimo * 1.5;
          default:
            return true;
        }
      });
    }

    const total = await prisma.material.count({ where });

    return NextResponse.json({
      data: materials,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error al obtener materiales:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener materiales' },
      { status: 500 }
    );
  }
}

// POST - Crear material
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = materialSchema.parse(body);
    
    // Verificar que el código sea único
    const existingMaterial = await prisma.material.findUnique({
      where: { codigo: validatedData.codigo }
    });
    
    if (existingMaterial) {
      return NextResponse.json(
        { error: 'Ya existe un material con ese código' },
        { status: 400 }
      );
    }
    
    const material = await prisma.material.create({
      data: validatedData,
      include: {
        proveedor: {
          select: { id: true, nombre: true, telefono: true }
        }
      }
    });
    
    return NextResponse.json(material, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear material:', error);
    
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
      { error: 'Error al crear material' },
      { status: 500 }
    );
  }
}