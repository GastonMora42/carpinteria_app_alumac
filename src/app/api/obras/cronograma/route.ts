
// src/app/api/obras/cronograma/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const soloAlertas = searchParams.get('soloAlertas') === 'true';
    
    console.log('📅 Fetching cronograma data with filters:', {
      estado,
      prioridad,
      soloAlertas
    });
    
    const where: any = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (prioridad) {
      where.prioridad = prioridad;
    }
    
    // Excluir obras ya completamente finalizadas
    if (!estado) {
      where.estado = {
        notIn: ['COBRADO', 'CANCELADO']
      };
    }

    const obras = await prisma.pedido.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            email: true
          }
        },
        presupuesto: {
          select: {
            id: true,
            numero: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            transacciones: true,
            materiales: true
          }
        }
      },
      orderBy: [
        { fechaEntrega: 'asc' },
        { prioridad: 'desc' },
        { fechaPedido: 'asc' }
      ]
    });

    // Procesar datos para el timeline
    const hoy = new Date();
    const obrasConAnalisis = obras.map(obra => {
      const fechaInicio = new Date(obra.fechaPedido);
      const fechaEntrega = obra.fechaEntrega ? new Date(obra.fechaEntrega) : null;
      const fechaEntregaReal = obra.fechaEntregaReal ? new Date(obra.fechaEntregaReal) : null;

      // Calcular días
      let diasTotales = 0;
      let diasTranscurridos = 0;
      let diasRestantes = 0;
      let porcentajeTiempo = 0;

      if (fechaEntrega) {
        diasTotales = Math.max(1, Math.ceil((fechaEntrega.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)));
        diasTranscurridos = Math.max(0, Math.ceil((hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)));
        diasRestantes = Math.ceil((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        porcentajeTiempo = Math.min(100, (diasTranscurridos / diasTotales) * 100);
      }

      // Determinar alertas
      const alertas = {
        atrasada: fechaEntrega ? diasRestantes < 0 && !fechaEntregaReal : false,
        proximaVencer: fechaEntrega ? diasRestantes >= 0 && diasRestantes <= 3 && !fechaEntregaReal : false,
        sinFechaEntrega: !fechaEntrega,
        sinAvance: Number(obra.porcentajeAvance) === 0 && diasTranscurridos > 3,
        sinPagos: obra._count.transacciones === 0 && diasTranscurridos > 1,
        saldoPendiente: Number(obra.saldoPendiente) > 0
      };

      // Determinar eficiencia
      let eficiencia: 'adelantado' | 'a_tiempo' | 'atrasado' | 'sin_datos' = 'sin_datos';
      
      if (fechaEntrega && Number(obra.porcentajeAvance) > 0) {
        const porcentajeAvance = Number(obra.porcentajeAvance);
        if (porcentajeAvance >= porcentajeTiempo + 15) {
          eficiencia = 'adelantado';
        } else if (porcentajeAvance >= porcentajeTiempo - 10) {
          eficiencia = 'a_tiempo';
        } else {
          eficiencia = 'atrasado';
        }
      }

      const tieneAlertas = Object.values(alertas).some(alerta => alerta);

      return {
        ...obra,
        fechaInicio,
        fechaEntrega,
        fechaEntregaReal,
        diasRestantes,
        diasTranscurridos,
        diasTotales,
        porcentajeTiempo,
        alertas,
        eficiencia,
        tieneAlertas,
        // Convertir Decimal a number
        subtotal: Number(obra.subtotal),
        descuento: Number(obra.descuento),
        impuestos: Number(obra.impuestos),
        total: Number(obra.total),
        totalCobrado: Number(obra.totalCobrado),
        saldoPendiente: Number(obra.saldoPendiente),
        porcentajeAvance: Number(obra.porcentajeAvance)
      };
    });

    // Filtrar solo alertas si se solicita
    const obrasFiltradas = soloAlertas ? 
      obrasConAnalisis.filter(obra => obra.tieneAlertas) : 
      obrasConAnalisis;

    // Generar estadísticas
    const estadisticas = {
      total: obrasConAnalisis.length,
      atrasadas: obrasConAnalisis.filter(o => o.alertas.atrasada).length,
      proximasVencer: obrasConAnalisis.filter(o => o.alertas.proximaVencer).length,
      adelantadas: obrasConAnalisis.filter(o => o.eficiencia === 'adelantado').length,
      sinFechaEntrega: obrasConAnalisis.filter(o => o.alertas.sinFechaEntrega).length,
      sinAvance: obrasConAnalisis.filter(o => o.alertas.sinAvance).length,
      conAlertas: obrasConAnalisis.filter(o => o.tieneAlertas).length,
      porcentajeEficiencia: {
        adelantado: obrasConAnalisis.filter(o => o.eficiencia === 'adelantado').length,
        aTiempo: obrasConAnalisis.filter(o => o.eficiencia === 'a_tiempo').length,
        atrasado: obrasConAnalisis.filter(o => o.eficiencia === 'atrasado').length,
        sinDatos: obrasConAnalisis.filter(o => o.eficiencia === 'sin_datos').length
      }
    };

    console.log('✅ Cronograma data processed successfully:', {
      totalObras: obrasFiltradas.length,
      conAlertas: estadisticas.conAlertas,
      atrasadas: estadisticas.atrasadas
    });

    return NextResponse.json({
      obras: obrasFiltradas,
      estadisticas,
      filtros: {
        estado,
        prioridad,
        soloAlertas
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching cronograma data:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener datos del cronograma' },
      { status: 500 }
    );
  }
}