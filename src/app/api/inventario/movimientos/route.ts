// src/app/api/inventario/movimientos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const movimientoSchema = z.object({
  materialId: z.string().uuid("ID de material inválido"),
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']),
  cantidad: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
  motivo: z.string().min(1, "El motivo es requerido"),
  referencia: z.string().optional()
});

// GET - Listar movimientos de inventario
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const materialId = searchParams.get('materialId');
    const tipo = searchParams.get('tipo');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (materialId) {
      where.materialId = materialId;
    }
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fecha.lte = new Date(fechaHasta + 'T23:59:59');
      }
    }
    
    if (search) {
      where.OR = [
        { motivo: { contains: search, mode: 'insensitive' } },
        { referencia: { contains: search, mode: 'insensitive' } },
        { material: { nombre: { contains: search, mode: 'insensitive' } } },
        { material: { codigo: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoInventario.findMany({
        where,
        include: {
          material: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              unidadMedida: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit
      }),
      prisma.movimientoInventario.count({ where })
    ]);

    return NextResponse.json({
      data: movimientos,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error al obtener movimientos:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    );
  }
}

// POST - Crear movimiento de inventario
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const body = await req.json();
    const validatedData = movimientoSchema.parse(body);
    
    // Verificar que el material existe
    const material = await prisma.material.findUnique({
      where: { id: validatedData.materialId },
      select: { 
        id: true, 
        stockActual: true, 
        nombre: true, 
        codigo: true,
        unidadMedida: true 
      }
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Material no encontrado' },
        { status: 404 }
      );
    }
    
    const stockActual = Number(material.stockActual);
    
    // Calcular nuevo stock
    let nuevoStock: number;
    switch (validatedData.tipo) {
      case 'ENTRADA':
        nuevoStock = stockActual + validatedData.cantidad;
        break;
      case 'SALIDA':
        if (stockActual < validatedData.cantidad) {
          return NextResponse.json(
            { error: 'Stock insuficiente para la salida' },
            { status: 400 }
          );
        }
        nuevoStock = stockActual - validatedData.cantidad;
        break;
      case 'AJUSTE':
        nuevoStock = validatedData.cantidad;
        break;
      default:
        throw new Error('Tipo de movimiento inválido');
    }
    
    // Crear movimiento y actualizar stock en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          materialId: validatedData.materialId,
          tipo: validatedData.tipo,
          cantidad: validatedData.cantidad,
          stockAnterior: stockActual,
          stockNuevo: nuevoStock,
          motivo: validatedData.motivo,
          referencia: validatedData.referencia,
          fecha: new Date(),
          userId: user.id
        },
        include: {
          material: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              unidadMedida: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        }
      });
      
      // Actualizar stock del material
      await tx.material.update({
        where: { id: validatedData.materialId },
        data: { stockActual: nuevoStock }
      });
      
      return movimiento;
    });
    
    console.log(`✅ Movimiento de inventario creado: ${result.tipo} de ${result.cantidad} ${result.material.unidadMedida} para ${result.material.nombre}`);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear movimiento:', error);
    
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
      { error: 'Error al crear movimiento' },
      { status: 500 }
    );
  }
}
