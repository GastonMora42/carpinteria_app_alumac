// src/app/api/dashboard/route.ts - ACTUALIZADO
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    // Usar la nueva verificación de Cognito
    const user = await verifyCognitoAuth(req);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Obtener estadísticas principales
    const [
      totalClientes,
      totalPresupuestosPendientes,
      totalPedidosPendientes,
      ventasMes,
      transaccionesRecientes,
      presupuestosVencenProximamente,
      pedidosEnProceso,
      saldosPorCobrar
    ] = await Promise.all([
      // Total clientes activos
      prisma.cliente.count({
        where: { activo: true }
      }),
      
      // Presupuestos pendientes
      prisma.presupuesto.count({
        where: { 
          estado: { in: ['PENDIENTE', 'ENVIADO'] }
        }
      }),
      
      // Pedidos pendientes/en proceso
      prisma.pedido.count({
        where: { 
          estado: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'EN_PRODUCCION'] }
        }
      }),
      
      // Ventas del mes actual
      prisma.transaccion.aggregate({
        where: {
          tipo: { in: ['INGRESO', 'PAGO_OBRA', 'ANTICIPO'] },
          fecha: { gte: startOfMonth }
        },
        _sum: { monto: true }
      }),
      
      // Transacciones recientes
      prisma.transaccion.findMany({
        take: 5,
        orderBy: { fecha: 'desc' },
        include: {
          cliente: { select: { nombre: true } },
          proveedor: { select: { nombre: true } },
          medioPago: { select: { nombre: true } }
        }
      }),
      
      // Presupuestos que vencen en los próximos 7 días
      prisma.presupuesto.findMany({
        where: {
          estado: { in: ['PENDIENTE', 'ENVIADO'] },
          fechaValidez: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          cliente: { select: { nombre: true } }
        },
        orderBy: { fechaValidez: 'asc' }
      }),
      
      // Pedidos en proceso
      prisma.pedido.findMany({
        where: {
          estado: { in: ['EN_PROCESO', 'EN_PRODUCCION'] }
        },
        include: {
          cliente: { select: { nombre: true } }
        },
        orderBy: { fechaEntrega: 'asc' },
        take: 10
      }),
      
      // Saldos por cobrar
      prisma.pedido.aggregate({
        where: {
          saldoPendiente: { gt: 0 },
          estado: { not: 'CANCELADO' }
        },
        _sum: { saldoPendiente: true }
      })
    ]);
    
    // Ventas por día de la semana (últimos 7 días)
    const ventasPorDia = await prisma.$queryRaw`
      SELECT 
        DATE(fecha) as fecha,
        SUM(monto) as total
      FROM "transacciones"
      WHERE tipo IN ('INGRESO', 'PAGO_OBRA', 'ANTICIPO')
        AND fecha >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE(fecha)
      ORDER BY fecha ASC
    `;
    
    return NextResponse.json({
      estadisticas: {
        totalClientes,
        totalPresupuestosPendientes,
        totalPedidosPendientes,
        ventasMes: ventasMes._sum.monto || 0,
        saldosPorCobrar: saldosPorCobrar._sum.saldoPendiente || 0
      },
      transaccionesRecientes,
      presupuestosVencenProximamente,
      pedidosEnProceso,
      ventasPorDia,
      resumen: {
        alertas: {
          presupuestosVencen: presupuestosVencenProximamente.length,
          pedidosAtrasados: pedidosEnProceso.filter((p: { fechaEntrega: string | number | Date; }) => 
            p.fechaEntrega && new Date(p.fechaEntrega) < now
          ).length
        }
      }
    });
  } catch (error: any) {
    console.error('Error al obtener datos del dashboard:', error);
    
    // Manejar errores de autenticación
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}

