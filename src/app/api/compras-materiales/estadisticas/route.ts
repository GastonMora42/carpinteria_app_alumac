// src/app/api/compras-materiales/estadisticas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    console.log('📊 Generating compras materiales statistics...');
    
    // Estadísticas básicas
    const [totalCompras, comprasPendientes, comprasEsteAño] = await Promise.all([
      prisma.compraMaterial.count(),
      prisma.compraMaterial.count({
        where: { estadoPago: 'PENDIENTE' }
      }),
      prisma.compraMaterial.count({
        where: {
          fechaCompra: {
            gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      })
    ]);

    // Montos totales
    const [montoTotal, montoPendiente] = await Promise.all([
      prisma.compraMaterial.aggregate({
        _sum: { total: true }
      }),
      prisma.compraMaterial.aggregate({
        _sum: { total: true },
        where: { estadoPago: 'PENDIENTE' }
      })
    ]);

    // Compras por mes (últimos 12 meses)
    const comprasPorMes = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "fechaCompra") as mes,
        COUNT(*)::int as cantidad,
        SUM("total")::float as monto
      FROM "compras_materiales"
      WHERE "fechaCompra" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "fechaCompra")
      ORDER BY mes DESC
      LIMIT 12
    `;

    // Materiales más comprados
    const materialesMasComprados = await prisma.$queryRaw`
      SELECT 
        m."nombre" as material,
        m."codigo" as codigo,
        COUNT(cm.id)::int as cantidad_compras,
        SUM(cm."cantidad")::float as cantidad_total,
        SUM(cm."total")::float as monto_total
      FROM "compras_materiales" cm
      JOIN "materiales" m ON cm."materialId" = m.id
      GROUP BY m.id, m."nombre", m."codigo"
      ORDER BY cantidad_compras DESC
      LIMIT 10
    `;

    // Proveedores principales
    const proveedoresPrincipales = await prisma.$queryRaw`
      SELECT 
        p."nombre" as proveedor,
        p."codigo" as codigo,
        COUNT(cm.id)::int as compras,
        SUM(cm."total")::float as monto_total,
        AVG(cm."total")::float as promedio_compra
      FROM "compras_materiales" cm
      JOIN "proveedores" p ON cm."proveedorId" = p.id
      GROUP BY p.id, p."nombre", p."codigo"
      ORDER BY monto_total DESC
      LIMIT 10
    `;

    // Pagos próximos a vencer (próximos 30 días)
    const pagosProximosVencer = await prisma.compraMaterial.count({
      where: {
        estadoPago: 'PENDIENTE',
        fechaVencimiento: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date()
        }
      }
    });

    // Pagos vencidos
    const pagosVencidos = await prisma.compraMaterial.count({
      where: {
        estadoPago: 'PENDIENTE',
        fechaVencimiento: {
          lt: new Date()
        }
      }
    });

    const estadisticas = {
      totalCompras,
      montoTotalCompras: Number(montoTotal._sum.total) || 0,
      comprasPendientesPago: comprasPendientes,
      montoPendientePago: Number(montoPendiente._sum.total) || 0,
      comprasEsteAño,
      pagosProximosVencer,
      pagosVencidos,
      comprasPorMes: (comprasPorMes as any[]).map(item => ({
        mes: new Date(item.mes).toLocaleDateString('es-AR', { year: 'numeric', month: 'short' }),
        cantidad: item.cantidad,
        monto: item.monto
      })),
      materialesMasComprados: (materialesMasComprados as any[]).map(item => ({
        material: item.material,
        codigo: item.codigo,
        cantidadCompras: item.cantidad_compras,
        cantidadTotal: item.cantidad_total,
        montoTotal: item.monto_total
      })),
      proveedoresPrincipales: (proveedoresPrincipales as any[]).map(item => ({
        proveedor: item.proveedor,
        codigo: item.codigo,
        compras: item.compras,
        montoTotal: item.monto_total,
        promedioCompra: item.promedio_compra
      }))
    };

    console.log('✅ Compras statistics generated successfully');

    return NextResponse.json(estadisticas);
  } catch (error: any) {
    console.error('❌ Error generating compras statistics:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al generar estadísticas de compras' },
      { status: 500 }
    );
  }
}
