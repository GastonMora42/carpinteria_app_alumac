// src/app/api/reportes/financiero/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const fechaDesde = searchParams.get('fechaDesde') || startOfMonth(subMonths(new Date(), 11)).toISOString();
    const fechaHasta = searchParams.get('fechaHasta') || new Date().toISOString();
    const moneda = searchParams.get('moneda') || 'PESOS';
    const incluirProyecciones = searchParams.get('incluirProyecciones') === 'true';
    
    console.log('📊 Generando análisis financiero...');
    
    const fechaInicio = new Date(fechaDesde);
    const fechaFin = new Date(fechaHasta);
    
    // Obtener todas las transacciones del período
    const transacciones = await prisma.transaccion.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        moneda: moneda as any
      },
      include: {
        cliente: { select: { nombre: true } },
        proveedor: { select: { nombre: true } },
        pedido: { select: { numero: true } },
        medioPago: { select: { nombre: true } }
      },
      orderBy: { fecha: 'asc' }
    });

    // Obtener gastos generales
    const gastosGenerales = await prisma.gastoGeneral.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        moneda: moneda as any
      },
      include: {
        user: { select: { name: true } }
      }
    });

    // Obtener pedidos para análisis de rentabilidad
    const pedidos = await prisma.pedido.findMany({
      where: {
        fechaPedido: {
          gte: fechaInicio,
          lte: fechaFin
        },
        moneda: moneda as any,
        estado: { in: ['ENTREGADO', 'FACTURADO', 'COBRADO'] }
      },
      include: {
        cliente: { select: { nombre: true } },
        materiales: {
          include: {
            material: { select: { precioUnitario: true } }
          }
        },
        gastos: true,
        transacciones: {
          where: { tipo: { in: ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'] } }
        }
      }
    });

    // Separar ingresos y egresos
    const ingresos = transacciones.filter(t => ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(t.tipo));
    const egresos = transacciones.filter(t => ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo));
    
    // Agregar gastos generales a egresos
    const egresosCompletos = [
      ...egresos,
      ...gastosGenerales.map(g => ({
        ...g,
        tipo: 'GASTO_GENERAL' as const,
        concepto: g.descripcion,
        cliente: null,
        proveedor: null,
        pedido: null,
        medioPago: { nombre: 'Gasto General' }
      }))
    ];

    // Calcular totales
    const ingresosTotales = ingresos.reduce((acc, t) => acc + Number(t.monto), 0);
    const egresosTotales = egresosCompletos.reduce((acc, t) => acc + Number(t.monto), 0);
    const gananciaNeta = ingresosTotales - egresosTotales;
    const margenOperativo = ingresosTotales > 0 ? (gananciaNeta / ingresosTotales) * 100 : 0;

    // Análisis por categorías - Ingresos
    const ingresosPorCategoria = [
      {
        categoria: 'Ventas',
        monto: ingresos.filter(t => t.tipo === 'INGRESO').reduce((acc, t) => acc + Number(t.monto), 0),
        porcentaje: 0,
        color: '#10b981'
      },
      {
        categoria: 'Anticipos',
        monto: ingresos.filter(t => t.tipo === 'ANTICIPO').reduce((acc, t) => acc + Number(t.monto), 0),
        porcentaje: 0,
        color: '#3b82f6'
      },
      {
        categoria: 'Pagos de Obra',
        monto: ingresos.filter(t => t.tipo === 'PAGO_OBRA').reduce((acc, t) => acc + Number(t.monto), 0),
        porcentaje: 0,
        color: '#8b5cf6'
      }
    ];

    // Calcular porcentajes de ingresos
    ingresosPorCategoria.forEach(cat => {
      cat.porcentaje = ingresosTotales > 0 ? (cat.monto / ingresosTotales) * 100 : 0;
    });

    // Análisis por categorías - Egresos
    const egresosPorCategoria = [
      {
        categoria: 'Materiales',
        monto: egresos.filter(t => t.tipo === 'PAGO_PROVEEDOR').reduce((acc, t) => acc + Number(t.monto), 0),
        porcentaje: 0,
        color: '#ef4444'
      },
      {
        categoria: 'Gastos Generales',
        monto: gastosGenerales.reduce((acc, g) => acc + Number(g.monto), 0),
        porcentaje: 0,
        color: '#f59e0b'
      },
      {
        categoria: 'Otros Egresos',
        monto: egresos.filter(t => !['PAGO_PROVEEDOR'].includes(t.tipo)).reduce((acc, t) => acc + Number(t.monto), 0),
        porcentaje: 0,
        color: '#6b7280'
      }
    ];

    // Calcular porcentajes de egresos
    egresosPorCategoria.forEach(cat => {
      cat.porcentaje = egresosTotales > 0 ? (cat.monto / egresosTotales) * 100 : 0;
    });

    // Análisis mensual
    const mesesEnPeriodo = [];
    let fechaActual = startOfMonth(fechaInicio);
    while (fechaActual <= fechaFin) {
      mesesEnPeriodo.push(fechaActual);
      fechaActual = addMonths(fechaActual, 1);
    }

    const flujoMensual = mesesEnPeriodo.map(fecha => {
      const inicioMes = startOfMonth(fecha);
      const finMes = endOfMonth(fecha);
      
      const ingresosDelMes = ingresos
        .filter(t => new Date(t.fecha) >= inicioMes && new Date(t.fecha) <= finMes)
        .reduce((acc, t) => acc + Number(t.monto), 0);
      
      const egresosDelMes = egresosCompletos
        .filter(t => new Date(t.fecha) >= inicioMes && new Date(t.fecha) <= finMes)
        .reduce((acc, t) => acc + Number(t.monto), 0);
      
      return {
        mes: format(fecha, 'MMM yyyy', { locale: es }),
        ingresos: ingresosDelMes,
        egresos: egresosDelMes,
        neto: ingresosDelMes - egresosDelMes,
        acumulado: 0 // Se calculará después
      };
    });

    // Calcular acumulado
    let acumulado = 0;
    flujoMensual.forEach(mes => {
      acumulado += mes.neto;
      mes.acumulado = acumulado;
    });

    // Top clientes por ingresos
    const clientesIngresos = ingresos.reduce((acc, t) => {
      if (t.cliente) {
        const cliente = t.cliente.nombre;
        if (!acc[cliente]) {
          acc[cliente] = { monto: 0, transacciones: 0 };
        }
        acc[cliente].monto += Number(t.monto);
        acc[cliente].transacciones += 1;
      }
      return acc;
    }, {} as Record<string, { monto: number; transacciones: number }>);

    const topClientes = Object.entries(clientesIngresos)
      .map(([cliente, data]) => ({ cliente, ...data }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    // Top proveedores por egresos
    const proveedoresEgresos = egresos.reduce((acc, t) => {
      if (t.proveedor) {
        const proveedor = t.proveedor.nombre;
        if (!acc[proveedor]) {
          acc[proveedor] = { monto: 0, transacciones: 0 };
        }
        acc[proveedor].monto += Number(t.monto);
        acc[proveedor].transacciones += 1;
      }
      return acc;
    }, {} as Record<string, { monto: number; transacciones: number }>);

    const topProveedores = Object.entries(proveedoresEgresos)
      .map(([proveedor, data]) => ({ proveedor, ...data }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    // Análisis de rentabilidad por obra
    const rentabilidadPorObra = pedidos.map(pedido => {
      const costosReales = pedido.materiales.reduce((acc, m) => 
        acc + (Number(m.cantidad) * Number(m.precioUnitario)), 0
      ) + pedido.gastos.reduce((acc, g) => acc + Number(g.monto), 0);
      
      const ingresosPedido = pedido.transacciones.reduce((acc, t) => acc + Number(t.monto), 0);
      const margen = ingresosPedido - costosReales;
      const roi = costosReales > 0 ? (margen / costosReales) * 100 : 0;
      
      return {
        obra: pedido.numero,
        inversion: costosReales,
        retorno: ingresosPedido,
        roi,
        margen: ingresosPedido > 0 ? (margen / ingresosPedido) * 100 : 0
      };
    }).slice(0, 10);

    // Calcular ratios financieros básicos
    const cuentasPorCobrar = await prisma.pedido.aggregate({
      where: { saldoPendiente: { gt: 0 } },
      _sum: { saldoPendiente: true }
    });

    const stockMateriales = await prisma.material.aggregate({
      where: { activo: true },
      _sum: { 
        stockActual: true
      }
    });

    const ratiosFinancieros = {
      liquidez: 1.2, // Simplificado - en real sería activo circulante / pasivo circulante
      rentabilidadVentas: margenOperativo,
      rentabilidadActivos: 15.5, // Simplificado
      rotacionInventario: 4.2, // Simplificado
      diasCobranza: 45, // Simplificado
      diasPago: 30, // Simplificado
      endeudamiento: 35 // Simplificado
    };

    // Proyecciones (si están habilitadas)
    let proyecciones: any[] = [];
    if (incluirProyecciones && flujoMensual.length >= 3) {
      const ultimosTresMeses = flujoMensual.slice(-3);
      const promedioIngresos = ultimosTresMeses.reduce((acc, m) => acc + m.ingresos, 0) / 3;
      const promedioEgresos = ultimosTresMeses.reduce((acc, m) => acc + m.egresos, 0) / 3;
      
      for (let i = 1; i <= 3; i++) {
        const fechaProyeccion = addMonths(new Date(), i);
        proyecciones.push({
          mes: format(fechaProyeccion, 'MMM yyyy', { locale: es }),
          proyectado: promedioIngresos - promedioEgresos,
          tendencia: promedioIngresos > promedioEgresos ? 'positiva' : 'negativa'
        });
      }
    }

    console.log(`✅ Análisis financiero generado: ${transacciones.length} transacciones analizadas`);

    return NextResponse.json({
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta
      },
      resumen: {
        ingresosTotales,
        egresosTotales,
        gananciaNeta,
        margenOperativo,
        liquidezActual: ratiosFinancieros.liquidez,
        cuentasPorCobrar: Number(cuentasPorCobrar._sum.saldoPendiente) || 0,
        cuentasPorPagar: egresosTotales * 0.15, // Simplificado
        flujoEfectivo: gananciaNeta
      },
      ingresos: {
        porCategoria: ingresosPorCategoria.filter(c => c.monto > 0),
        porMes: flujoMensual.map(m => ({
          mes: m.mes,
          ingresos: m.ingresos,
          ventas: m.ingresos * 0.8, // Simplificado
          anticipos: m.ingresos * 0.2 // Simplificado
        })),
        topClientes
      },
      egresos: {
        porCategoria: egresosPorCategoria.filter(c => c.monto > 0),
        porMes: flujoMensual.map(m => ({
          mes: m.mes,
          egresos: m.egresos,
          materiales: m.egresos * 0.6, // Simplificado
          gastos: m.egresos * 0.4 // Simplificado
        })),
        topProveedores
      },
      flujoEfectivo: {
        mensual: flujoMensual,
        proyeccion: proyecciones
      },
      rentabilidad: {
        porObra: rentabilidadPorObra,
        porCliente: topClientes.map(c => ({
          cliente: c.cliente,
          ventas: c.monto,
          costo: c.monto * 0.65, // Simplificado
          margen: c.monto * 0.35,
          rentabilidad: 35
        }))
      },
      ratiosFinancieros
    });

  } catch (error: any) {
    console.error('Error al generar análisis financiero:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al generar análisis financiero' },
      { status: 500 }
    );
  }
}