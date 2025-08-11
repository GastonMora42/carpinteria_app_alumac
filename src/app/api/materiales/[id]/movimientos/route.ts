// src/app/api/materiales/[id]/movimientos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { z } from 'zod';

const movimientoSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE', 'COMPRA']),
  cantidad: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
  motivo: z.string().min(1, "El motivo es requerido"),
  referencia: z.string().optional()
});

// POST - Crear movimiento de stock
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    const body = await req.json();
    
    console.log('📦 Creating stock movement for material:', id);
    
    const validatedData = movimientoSchema.parse(body);
    
    // Verificar que el material existe
    const material = await prisma.material.findUnique({
      where: { id },
      select: { 
        id: true, 
        nombre: true, 
        stockActual: true,
        unidadMedida: true
      }
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Material no encontrado' },
        { status: 404 }
      );
    }
    
    const stockAnterior = Number(material.stockActual);
    let stockNuevo = stockAnterior;
    
    // Calcular nuevo stock según el tipo de movimiento
    switch (validatedData.tipo) {
      case 'ENTRADA':
      case 'COMPRA':
        stockNuevo = stockAnterior + validatedData.cantidad;
        break;
      case 'SALIDA':
        stockNuevo = Math.max(0, stockAnterior - validatedData.cantidad);
        break;
      case 'AJUSTE':
        stockNuevo = validatedData.cantidad; // En ajuste, la cantidad ES el nuevo stock
        break;
    }
    
    // Crear el movimiento y actualizar stock en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          materialId: id,
          tipo: validatedData.tipo,
          cantidad: validatedData.cantidad,
          stockAnterior: stockAnterior,
          stockNuevo: stockNuevo,
          motivo: validatedData.motivo,
          referencia: validatedData.referencia,
          fecha: new Date(),
          userId: user.id
        },
        include: {
          material: {
            select: { nombre: true, unidadMedida: true }
          },
          user: {
            select: { name: true }
          }
        }
      });
      
      // 2. Actualizar stock del material
      const materialActualizado = await tx.material.update({
        where: { id },
        data: { stockActual: stockNuevo },
        select: { 
          id: true, 
          nombre: true, 
          stockActual: true,
          stockMinimo: true,
          unidadMedida: true
        }
      });
      
      return { movimiento, material: materialActualizado };
    });
    
    console.log('✅ Stock movement created successfully:', {
      tipo: validatedData.tipo,
      cantidad: validatedData.cantidad,
      stockAnterior,
      stockNuevo,
      material: material.nombre
    });
    
    return NextResponse.json({
      success: true,
      movimiento: result.movimiento,
      material: result.material,
      message: `Stock actualizado: ${stockAnterior} → ${stockNuevo} ${material.unidadMedida}`
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Error creating stock movement:', error);
    
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
      { error: 'Error al crear movimiento de stock' },
      { status: 500 }
    );
  }
}

// GET - Obtener historial de movimientos de un material
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('📋 Fetching movement history for material:', id);
    
    const movimientos = await prisma.movimientoInventario.findMany({
      where: { materialId: id },
      include: {
        user: {
          select: { name: true }
        },
        compraMaterial: {
          select: {
            numero: true,
            numeroFactura: true,
            proveedor: {
              select: { nombre: true }
            }
          }
        }
      },
      orderBy: { fecha: 'desc' },
      take: limit
    });
    
    console.log('✅ Movement history fetched:', movimientos.length, 'records');
    
    return NextResponse.json({
      data: movimientos,
      total: movimientos.length
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching movement history:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener historial de movimientos' },
      { status: 500 }
    );
  }
}