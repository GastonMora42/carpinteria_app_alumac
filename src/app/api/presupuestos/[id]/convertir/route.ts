
// ===================================
// src/app/api/presupuestos/[id]/convertir/route.ts - CORREGIDO PARA NEXT.JS 15
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// POST - Convertir presupuesto a pedido
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await verifyCognitoAuth(req);
    
    // Obtener parámetros (async en Next.js 15)
    const { id } = await params;
    
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id },
      include: {
        items: true,
        cliente: true
      }
    });
    
    if (!presupuesto) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }
    
    if (presupuesto.estado !== 'APROBADO') {
      return NextResponse.json(
        { error: 'Solo se pueden convertir presupuestos aprobados' },
        { status: 400 }
      );
    }
    
    // Generar número de pedido
    const count = await prisma.pedido.count();
    const numeroPedido = `VEN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    // Crear pedido en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear pedido
      const pedido = await tx.pedido.create({
        data: {
          numero: numeroPedido,
          clienteId: presupuesto.clienteId,
          presupuestoId: presupuesto.id,
          descripcionObra: presupuesto.descripcionObra,
          observaciones: presupuesto.observaciones,
          condicionesPago: presupuesto.condicionesPago,
          subtotal: presupuesto.subtotal,
          descuento: presupuesto.descuento,
          impuestos: presupuesto.impuestos,
          total: presupuesto.total,
          saldoPendiente: presupuesto.total,
          moneda: presupuesto.moneda,
          userId: user.id
        }
      });
      
      // Actualizar estado del presupuesto
      await tx.presupuesto.update({
        where: { id: presupuesto.id },
        data: { estado: 'CONVERTIDO' }
      });
      
      return pedido;
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error al convertir presupuesto:', error);
    
    // Manejar errores de autenticación
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al convertir presupuesto' },
      { status: 500 }
    );
  }
}