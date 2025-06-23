// src/app/api/reportes/rendimiento/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { differenceInDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const estado = searchParams.get('estado');
    const clienteId = searchParams.get('clienteId');
    const search = searchParams.get('search');
    
    console.log('📊 Generando reporte de rendimiento por obra...');
    
    // Construir filtros
    const where: any = {};
    
    if (fechaDesde || fechaHasta) {
      where.fechaPedido = {};
      if (fechaDesde) {
        where.fechaPedido.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fechaPedido.lte = new Date(fechaHasta + 'T23:59:59');
      }
    }
    
    if (estado) {
      where.estado = estado;
    }
    
    if (clienteId) {
      where.clienteId = clienteId;
    }
    
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { descripcionObra: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Obtener pedidos/obras con información completa
    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: {
          select: { nombre: true }
        },
        presupuesto: {
          select: { 
            total: true,
            fechaEmision: true
          }
        },
        materiales: {
          include: {
            material: {
              select: { precioUnitario: true }
            }
          }
        },
        gastos: true,
        transacciones: {
          where: { tipo: { in: ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'] } }
        }
      },
      orderBy: { fechaPedido: 'desc' }
    });

    // Calcular métricas para cada obra
    const obrasConMetricas = pedidos.map(pedido => {
      // Calcular costos reales
      const totalMateriales = pedido.materiales.reduce((acc, m) => 
        acc + (Number(m.cantidad) * Number(m.precioUnitario)), 0
      );
      
      const totalGastos = pedido.gastos.reduce((acc, g) => 
        acc + Number(g.monto), 0
      );
      
      const totalCostos = totalMateriales + totalGastos;
      const totalPresupuestado = Number(pedido.total);
      const totalCobrado = Number(pedido.totalCobrado);
      
      // Calcular márgenes
      const margenBruto = totalPresupuestado - totalCostos;
      const margenPorcentaje = totalPresupuestado > 0 ? (margenBruto / totalPresupuestado) * 100 : 0;
      
      // Calcular desviaciones
      const desviacionPpto = totalCostos > 0 && totalPresupuestado > 0 
        ? ((totalCostos - (totalPresupuestado * 0.7)) / (totalPresupuestado * 0.7)) * 100  // Asumimos 70% como costo objetivo
        : 0;
      
      // Calcular desviación de tiempo
      let desviacionTiempo = 0;
      if (pedido.fechaEntrega && pedido.fechaEntregaReal) {
        desviacionTiempo = differenceInDays(
          new Date(pedido.fechaEntregaReal), 
          new Date(pedido.fechaEntrega)
        );
      } else if (pedido.fechaEntrega && ['ENTREGADO', 'FACTURADO', 'COBRADO'].includes(pedido.estado)) {
        // Si está entregado pero no tiene fecha real, usar fecha actual
        desviacionTiempo = differenceInDays(new Date(), new Date(pedido.fechaEntrega));
      }
      
      // Calcular rentabilidad (ROI)
      const rentabilidad = totalCostos > 0 ? (margenBruto / totalCostos) * 100 : 0;
      
      // Calcular eficiencia (basada en tiempo y costo)
      const eficienciaTiempo = Math.max(0, 100 - Math.abs(desviacionTiempo) * 2); // Penalizar por días de desvío
      const eficienciaCosto = Math.max(0, 100 - Math.abs(desviacionPpto) / 2); // Penalizar por desvío de presupuesto
      const eficiencia = (eficienciaTiempo + eficienciaCosto) / 2;

      return {
        id: pedido.id,
        numero: pedido.numero,
        cliente: pedido.cliente,
        descripcionObra: pedido.descripcionObra || 'Sin descripción',
        fechaInicio: pedido.fechaPedido,
        fechaEntrega: pedido.fechaEntrega,
        fechaEntregaReal: pedido.fechaEntregaReal,
        estado: pedido.estado,
        totalPresupuestado,
        totalMateriales,
        totalGastos,
        totalCobrado,
        saldoPendiente: Number(pedido.saldoPendiente),
        margenBruto,
        margenPorcentaje,
        desviacionPpto,
        desviacionTiempo,
        rentabilidad,
        eficiencia,
        moneda: pedido.moneda
      };
    });

    // Calcular resumen
    const resumen = {
      totalObras: obrasConMetricas.length,
      promedioMargen: obrasConMetricas.length > 0 
        ? obrasConMetricas.reduce((acc, o) => acc + o.margenPorcentaje, 0) / obrasConMetricas.length 
        : 0,
      totalFacturado: obrasConMetricas.reduce((acc, o) => acc + o.totalPresupuestado, 0),
      totalCostos: obrasConMetricas.reduce((acc, o) => acc + o.totalMateriales + o.totalGastos, 0),
      gananciaNeta: obrasConMetricas.reduce((acc, o) => acc + o.margenBruto, 0),
      obrasRentables: obrasConMetricas.filter(o => o.margenPorcentaje > 0).length,
      obrasPerdida: obrasConMetricas.filter(o => o.margenPorcentaje < 0).length,
      promedioDiasDesvio: obrasConMetricas.length > 0
        ? obrasConMetricas.reduce((acc, o) => acc + o.desviacionTiempo, 0) / obrasConMetricas.length
        : 0
    };

    // Preparar datos para gráficos
    const chartData = {
      margenPorObra: obrasConMetricas.slice(0, 10).map(obra => ({
        numero: obra.numero,
        margen: obra.margenPorcentaje,
        rentabilidad: obra.rentabilidad
      })),
      rentabilidadVsTiempo: obrasConMetricas.map(obra => ({
        dias: Math.abs(obra.desviacionTiempo),
        rentabilidad: obra.rentabilidad,
        numero: obra.numero
      })),
      distribucionMargenes: [
        { 
          name: 'Pérdida (< 0%)', 
          value: obrasConMetricas.filter(o => o.margenPorcentaje < 0).length,
          color: '#ef4444'
        },
        { 
          name: 'Bajo (0-15%)', 
          value: obrasConMetricas.filter(o => o.margenPorcentaje >= 0 && o.margenPorcentaje < 15).length,
          color: '#f59e0b'
        },
        { 
          name: 'Bueno (15-30%)', 
          value: obrasConMetricas.filter(o => o.margenPorcentaje >= 15 && o.margenPorcentaje < 30).length,
          color: '#3b82f6'
        },
        { 
          name: 'Excelente (≥30%)', 
          value: obrasConMetricas.filter(o => o.margenPorcentaje >= 30).length,
          color: '#10b981'
        }
      ]
    };

    console.log(`✅ Reporte generado: ${obrasConMetricas.length} obras analizadas`);

    return NextResponse.json({
      obras: obrasConMetricas,
      resumen,
      chartData
    });

  } catch (error: any) {
    console.error('Error al generar reporte de rendimiento:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al generar reporte de rendimiento' },
      { status: 500 }
    );
  }
}