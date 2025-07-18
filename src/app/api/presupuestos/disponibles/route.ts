// src/app/api/presupuestos/disponibles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// GET - Obtener presupuestos disponibles para conversión a venta
export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    console.log('📋 Fetching presupuestos disponibles para venta...');
    
    // Obtener presupuestos que pueden convertirse a venta
    const presupuestosDisponibles = await prisma.presupuesto.findMany({
      where: {
        estado: 'APROBADO',
        pedido: null, // No debe tener pedido asociado (no convertido)
        fechaValidez: {
          gte: new Date() // No vencido
        }
      },
      include: {
        cliente: {
          select: { 
            id: true, 
            codigo: true,
            nombre: true, 
            email: true, 
            telefono: true 
          }
        },
        user: {
          select: { id: true, name: true }
        },
        items: {
          orderBy: { orden: 'asc' }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { fechaEmision: 'desc' }
    });

    console.log(`✅ Found ${presupuestosDisponibles.length} presupuestos disponibles`);

    // Enriquecer con información adicional
    const presupuestosEnriquecidos = presupuestosDisponibles.map(presupuesto => {
      const fechaVencimiento = new Date(presupuesto.fechaValidez);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...presupuesto,
        diasRestantes,
        urgente: diasRestantes <= 7, // Marcar como urgente si vence en 7 días o menos
        valorTotal: Number(presupuesto.total)
      };
    });

    return NextResponse.json({
      data: presupuestosEnriquecidos,
      estadisticas: {
        total: presupuestosEnriquecidos.length,
        montoTotal: presupuestosEnriquecidos.reduce((acc, p) => acc + p.valorTotal, 0),
        urgentes: presupuestosEnriquecidos.filter(p => p.urgente).length,
        promedioDiasVencimiento: presupuestosEnriquecidos.length > 0 
          ? Math.round(presupuestosEnriquecidos.reduce((acc, p) => acc + p.diasRestantes, 0) / presupuestosEnriquecidos.length)
          : 0
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching presupuestos disponibles:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener presupuestos disponibles' },
      { status: 500 }
    );
  }
}

// POST - Reservar presupuesto para conversión (opcional, para evitar conversiones simultáneas)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    const { presupuestoId, reservar } = await req.json();
    
    if (!presupuestoId) {
      return NextResponse.json(
        { error: 'ID de presupuesto requerido' },
        { status: 400 }
      );
    }

    console.log(`🔒 ${reservar ? 'Reservando' : 'Liberando'} presupuesto para conversión:`, presupuestoId);
    
    // Verificar que el presupuesto existe y está disponible
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      include: {
        pedido: { select: { id: true, numero: true } }
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
    
    if (presupuesto.pedido) {
      return NextResponse.json(
        { error: 'Este presupuesto ya fue convertido a venta' },
        { status: 400 }
      );
    }
    
    // Verificar vencimiento
    if (new Date(presupuesto.fechaValidez) < new Date()) {
      return NextResponse.json(
        { error: 'Este presupuesto está vencido' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      mensaje: reservar ? 'Presupuesto reservado para conversión' : 'Presupuesto liberado',
      presupuesto: {
        id: presupuesto.id,
        numero: presupuesto.numero,
        cliente: presupuesto.clienteId,
        total: presupuesto.total,
        moneda: presupuesto.moneda
      }
    });
  } catch (error: any) {
    console.error('❌ Error reservando/liberando presupuesto:', error);
    
    if (error.message?.includes('Token') || error.message?.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}