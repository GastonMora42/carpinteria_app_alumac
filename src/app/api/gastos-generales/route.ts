// src/app/api/gastos-generales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const gastoGeneralSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida"),
  categoria: z.string().min(1, "La categoría es requerida"),
  subcategoria: z.string().optional(),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.enum(['PESOS', 'DOLARES']).default('PESOS'),
  fecha: z.string().transform(str => new Date(str)),
  periodo: z.string().optional(),
  numeroFactura: z.string().optional(),
  proveedor: z.string().optional()
});

// GET - Listar gastos generales
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoria = searchParams.get('categoria');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const periodo = searchParams.get('periodo');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fecha.lte = new Date(fechaHasta);
      }
    }
    
    if (periodo) {
      where.periodo = periodo;
    }

    const [gastos, total] = await Promise.all([
      prisma.gastoGeneral.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true }
          }
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit
      }),
      prisma.gastoGeneral.count({ where })
    ]);

    return NextResponse.json({
      data: gastos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error al obtener gastos generales:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener gastos generales' },
      { status: 500 }
    );
  }
}

// POST - Crear gasto general
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = gastoGeneralSchema.parse(body);
    
    // Generar número único
    const count = await prisma.gastoGeneral.count();
    const numero = `GG-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    const gastoGeneral = await prisma.gastoGeneral.create({
      data: {
        numero,
        ...validatedData,
        userId: user.id
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });
    
    return NextResponse.json(gastoGeneral, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear gasto general:', error);
    
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
      { error: 'Error al crear gasto general' },
      { status: 500 }
    );
  }
}