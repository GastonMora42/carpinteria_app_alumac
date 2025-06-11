// ===================================

// src/app/api/presupuestos/[id]/convertir/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAuth } from '@/lib/auth/verify';

// POST - Convertir presupuesto a pedido
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('token')?.value;
    const user = await verifyAuth(token);
    
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: params.id },
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
    const result = await prisma.$transaction(async (tx: { pedido: { create: (arg0: { data: { numero: string; clienteId: any; presupuestoId: any; descripcionObra: any; observaciones: any; condicionesPago: any; subtotal: any; descuento: any; impuestos: any; total: any; saldoPendiente: any; moneda: any; userId: any; }; }) => any; }; presupuesto: { update: (arg0: { where: { id: any; }; data: { estado: string; }; }) => any; }; }) => {
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
  } catch (error) {
    console.error('Error al convertir presupuesto:', error);
    return NextResponse.json(
      { error: 'Error al convertir presupuesto' },
      { status: 500 }
    );
  }
}

