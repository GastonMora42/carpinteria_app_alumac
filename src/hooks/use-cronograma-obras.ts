// src/hooks/use-cronograma-obras.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/utils/http';

export interface ObraTimeline {
  id: string;
  numero: string;
  cliente: {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
  };
  descripcionObra?: string;
  fechaInicio: Date;
  fechaEntrega?: Date;
  fechaEntregaReal?: Date;
  diasRestantes: number;
  diasTranscurridos: number;
  diasTotales: number;
  porcentajeAvance: number;
  porcentajeTiempo: number;
  estado: string;
  prioridad: string;
  total: number;
  totalCobrado: number;
  saldoPendiente: number;
  alertas: {
    atrasada: boolean;
    proximaVencer: boolean;
    sinFechaEntrega: boolean;
    sinAvance: boolean;
    sinPagos: boolean;
    saldoPendiente: boolean;
  };
  eficiencia: 'adelantado' | 'a_tiempo' | 'atrasado' | 'sin_datos';
  tieneAlertas: boolean;
  presupuesto?: {
    id: string;
    numero: string;
  };
  user: {
    id: string;
    name: string;
  };
  _count: {
    transacciones: number;
    materiales: number;
  };
}

export interface EstadisticasCronograma {
  total: number;
  atrasadas: number;
  proximasVencer: number;
  adelantadas: number;
  sinFechaEntrega: number;
  sinAvance: number;
  conAlertas: number;
  porcentajeEficiencia: {
    adelantado: number;
    aTiempo: number;
    atrasado: number;
    sinDatos: number;
  };
}

interface UseCronogramaParams {
  estado?: string;
  prioridad?: string;
  soloAlertas?: boolean;
  autoRefresh?: boolean;
}

export function useCronogramaObras(params: UseCronogramaParams = {}) {
  const [obras, setObras] = useState<ObraTimeline[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasCronograma>({
    total: 0,
    atrasadas: 0,
    proximasVencer: 0,
    adelantadas: 0,
    sinFechaEntrega: 0,
    sinAvance: 0,
    conAlertas: 0,
    porcentajeEficiencia: {
      adelantado: 0,
      aTiempo: 0,
      atrasado: 0,
      sinDatos: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchCronograma = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Fetching cronograma data with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && key !== 'autoRefresh') {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/obras/cronograma?${searchParams}`);
      
      console.log('✅ Cronograma data fetched successfully:', {
        obras: data.obras?.length || 0,
        conAlertas: data.estadisticas?.conAlertas || 0
      });
      
      // Convertir fechas de string a Date objects
      const obrasConFechas = (data.obras || []).map((obra: any) => ({
        ...obra,
        fechaInicio: new Date(obra.fechaInicio),
        fechaEntrega: obra.fechaEntrega ? new Date(obra.fechaEntrega) : undefined,
        fechaEntregaReal: obra.fechaEntregaReal ? new Date(obra.fechaEntregaReal) : undefined
      }));
      
      setObras(obrasConFechas);
      setEstadisticas(data.estadisticas || {
        total: 0,
        atrasadas: 0,
        proximasVencer: 0,
        adelantadas: 0,
        sinFechaEntrega: 0,
        sinAvance: 0,
        conAlertas: 0,
        porcentajeEficiencia: {
          adelantado: 0,
          aTiempo: 0,
          atrasado: 0,
          sinDatos: 0
        }
      });
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('❌ Error fetching cronograma data:', err);
      setError(err.message || 'Error al cargar datos del cronograma');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login?from=/obras/cronograma';
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  // Auto-refresh cada 5 minutos si está habilitado
  useEffect(() => {
    if (!params.autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing cronograma data...');
      fetchCronograma();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchCronograma, params.autoRefresh]);

  useEffect(() => {
    console.log('🔄 useCronogramaObras effect triggered with params:', params);
    fetchCronograma();
  }, [fetchCronograma]);

  // Funciones de análisis derivadas
  const getObrasPorPrioridad = useCallback(() => {
    const prioridades = ['URGENTE', 'ALTA', 'NORMAL', 'BAJA'];
    return prioridades.map(prioridad => ({
      prioridad,
      cantidad: obras.filter(obra => obra.prioridad === prioridad).length,
      conAlertas: obras.filter(obra => obra.prioridad === prioridad && obra.tieneAlertas).length
    }));
  }, [obras]);

  const getObrasPorEstado = useCallback(() => {
    const estados = ['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'EN_PRODUCCION', 'LISTO_ENTREGA', 'ENTREGADO', 'FACTURADO'];
    return estados.map(estado => ({
      estado,
      cantidad: obras.filter(obra => obra.estado === estado).length,
      conAlertas: obras.filter(obra => obra.estado === estado && obra.tieneAlertas).length
    }));
  }, [obras]);

  const getObrasUrgentes = useCallback(() => {
    return obras.filter(obra => 
      obra.alertas.atrasada || 
      obra.alertas.proximaVencer || 
      (obra.prioridad === 'URGENTE' && obra.alertas.sinAvance)
    ).slice(0, 5);
  }, [obras]);

  const getRendimientoGeneral = useCallback(() => {
    if (obras.length === 0) return null;

    const obrasConFecha = obras.filter(obra => obra.fechaEntrega);
    const promedioAvance = obras.reduce((acc, obra) => acc + obra.porcentajeAvance, 0) / obras.length;
    const obrasDentroDelPlazo = obrasConFecha.filter(obra => 
      obra.eficiencia === 'adelantado' || obra.eficiencia === 'a_tiempo'
    ).length;
    const eficienciaGeneral = obrasConFecha.length > 0 ? (obrasDentroDelPlazo / obrasConFecha.length) * 100 : 0;

    return {
      promedioAvance: Math.round(promedioAvance),
      eficienciaGeneral: Math.round(eficienciaGeneral),
      obrasCompletas: obras.filter(obra => obra.porcentajeAvance === 100).length,
      obrasDentroDelPlazo,
      totalObrasConFecha: obrasConFecha.length
    };
  }, [obras]);

  const getProximosVencimientos = useCallback(() => {
    return obras
      .filter(obra => obra.fechaEntrega && obra.diasRestantes >= 0 && obra.diasRestantes <= 7)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 10);
  }, [obras]);

  const getIndicadoresFinancieros = useCallback(() => {
    const totalFacturado = obras.reduce((acc, obra) => acc + (obra.total - obra.saldoPendiente), 0);
    const totalPendiente = obras.reduce((acc, obra) => acc + obra.saldoPendiente, 0);
    const totalObras = obras.reduce((acc, obra) => acc + obra.total, 0);
    
    return {
      totalFacturado,
      totalPendiente,
      totalObras,
      porcentajeFacturado: totalObras > 0 ? (totalFacturado / totalObras) * 100 : 0,
      obrasSinCobrar: obras.filter(obra => obra.saldoPendiente > 0).length
    };
  }, [obras]);

  return {
    obras,
    estadisticas,
    loading,
    error,
    lastUpdate,
    refetch: fetchCronograma,
    
    // Funciones de análisis
    getObrasPorPrioridad,
    getObrasPorEstado,
    getObrasUrgentes,
    getRendimientoGeneral,
    getProximosVencimientos,
    getIndicadoresFinancieros,
    
    // Estados derivados
    hasAlertas: estadisticas.conAlertas > 0,
    totalAlertas: estadisticas.conAlertas,
    rendimientoGeneral: getRendimientoGeneral()
  };
}

// Hook especializado para alertas de cronograma
export function useAlertasCronograma() {
  const { obras, estadisticas, loading } = useCronogramaObras({ 
    soloAlertas: true,
    autoRefresh: true 
  });
  
  const alertasCriticas = obras.filter(obra => 
    obra.alertas.atrasada || (obra.prioridad === 'URGENTE' && obra.tieneAlertas)
  );
  
  const alertasImportantes = obras.filter(obra => 
    obra.alertas.proximaVencer || obra.alertas.sinAvance
  );
  
  const alertasInformativas = obras.filter(obra => 
    obra.alertas.sinFechaEntrega || obra.alertas.sinPagos
  );

  return {
    alertasCriticas,
    alertasImportantes,
    alertasInformativas,
    totalAlertas: obras.length,
    loading,
    estadisticas
  };
}

// Hook para métricas de rendimiento
export function useMetricasRendimiento() {
  const { obras, loading } = useCronogramaObras();
  
  const metricas = obras.length > 0 ? {
    tiempoPromedioEntrega: calcularTiempoPromedioEntrega(obras),
    tasaCompletacion: calcularTasaCompletacion(obras),
    eficienciaPromedio: calcularEficienciaPromedio(obras),
    indiceRetrasos: calcularIndiceRetrasos(obras),
    satisfaccionCliente: calcularSatisfaccionCliente(obras)
  } : null;
  
  return { metricas, loading };
}

// Funciones auxiliares de cálculo
function calcularTiempoPromedioEntrega(obras: ObraTimeline[]): number {
  const obrasCompletadas = obras.filter(obra => 
    obra.fechaEntregaReal || obra.estado === 'ENTREGADO'
  );
  
  if (obrasCompletadas.length === 0) return 0;
  
  const tiempoTotal = obrasCompletadas.reduce((acc, obra) => {
    return acc + obra.diasTotales;
  }, 0);
  
  return Math.round(tiempoTotal / obrasCompletadas.length);
}

function calcularTasaCompletacion(obras: ObraTimeline[]): number {
  if (obras.length === 0) return 0;
  const obrasCompletadas = obras.filter(obra => obra.porcentajeAvance === 100).length;
  return (obrasCompletadas / obras.length) * 100;
}

function calcularEficienciaPromedio(obras: ObraTimeline[]): number {
  const obrasConFecha = obras.filter(obra => obra.fechaEntrega);
  if (obrasConFecha.length === 0) return 0;
  
  const obrasEficientes = obrasConFecha.filter(obra => 
    obra.eficiencia === 'adelantado' || obra.eficiencia === 'a_tiempo'
  ).length;
  
  return (obrasEficientes / obrasConFecha.length) * 100;
}

function calcularIndiceRetrasos(obras: ObraTimeline[]): number {
  const obrasConFecha = obras.filter(obra => obra.fechaEntrega);
  if (obrasConFecha.length === 0) return 0;
  
  const obrasAtrasadas = obrasConFecha.filter(obra => obra.alertas.atrasada).length;
  return (obrasAtrasadas / obrasConFecha.length) * 100;
}

function calcularSatisfaccionCliente(obras: ObraTimeline[]): number {
  // Métrica simplificada basada en entregas a tiempo y pagos completos
  if (obras.length === 0) return 0;
  
  const obrasPositivas = obras.filter(obra => 
    !obra.alertas.atrasada && 
    obra.saldoPendiente < (obra.total * 0.1) // Menos del 10% de saldo pendiente
  ).length;
  
  return (obrasPositivas / obras.length) * 100;
}