// src/hooks/use-pagos-ventas.ts - VERSIÓN CORREGIDA Y OPTIMIZADA
import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/http';
import { TransaccionFormData } from '@/lib/validations/transaccion';

export interface PagoVenta {
  id: string;
  numero: string;
  fecha: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  moneda: string;
  numeroComprobante?: string;
  tipoComprobante?: string;
  medioPago: {
    id: string;
    nombre: string;
  };
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface EstadisticasPagos {
  totalPagos: number;
  montoCobrado: number;
  saldoPendiente: number;
  porcentajeCobrado: number;
  ultimoPago?: PagoVenta;
  pagoPromedio: number;
  proximoVencimiento?: Date;
}

export interface VentaInfo {
  id: string;
  numero: string;
  total: number;
  totalCobrado: number;
  saldoPendiente: number;
  moneda: string;
  cliente: {
    id: string;
    nombre: string;
  };
}

export function usePagosVenta(ventaId: string | null) {
  const [pagos, setPagos] = useState<PagoVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPagos>({
    totalPagos: 0,
    montoCobrado: 0,
    saldoPendiente: 0,
    porcentajeCobrado: 0,
    pagoPromedio: 0
  });

  const fetchPagos = async () => {
    if (!ventaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching pagos for venta:', ventaId);
      
      // Obtener transacciones de tipo pago para esta venta
      const params = new URLSearchParams({
        pedidoId: ventaId,
        tipo: 'PAGO_OBRA'
      });
      
      const data = await api.get(`/api/transacciones?${params}`);
      
      console.log('✅ Pagos fetched successfully:', data.data?.length || 0);
      
      const pagosData = data.data || [];
      setPagos(pagosData);

      // Calcular estadísticas
      const totalPagos = pagosData.length;
      const montoCobrado = pagosData.reduce((acc: number, pago: PagoVenta) => acc + Number(pago.monto), 0);
      const ultimoPago = pagosData.length > 0 ? pagosData[0] : undefined;
      const pagoPromedio = totalPagos > 0 ? montoCobrado / totalPagos : 0;

      setEstadisticas(prev => ({
        ...prev,
        totalPagos,
        montoCobrado,
        ultimoPago,
        pagoPromedio
      }));
      
    } catch (err: any) {
      console.error('❌ Error fetching pagos:', err);
      setError(err.message || 'Error al cargar pagos');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const registrarPago = async (pagoData: TransaccionFormData): Promise<PagoVenta> => {
    try {
      console.log('➕ Registering pago for venta:', ventaId);
      
      const nuevoPago = await api.post('/api/transacciones', pagoData);
      
      console.log('✅ Pago registered successfully:', nuevoPago.id);
      
      // Actualizar lista de pagos
      setPagos(prev => [nuevoPago, ...prev]);
      
      // Recalcular estadísticas
      setEstadisticas(prev => ({
        ...prev,
        totalPagos: prev.totalPagos + 1,
        montoCobrado: prev.montoCobrado + pagoData.monto,
        ultimoPago: nuevoPago,
        pagoPromedio: (prev.montoCobrado + pagoData.monto) / (prev.totalPagos + 1)
      }));
      
      return nuevoPago;
    } catch (err: any) {
      console.error('❌ Error registering pago:', err);
      throw new Error(err.message || 'Error al registrar pago');
    }
  };

  const anularPago = async (pagoId: string): Promise<void> => {
    try {
      console.log('❌ Anulando pago:', pagoId);
      
      await api.delete(`/api/transacciones/${pagoId}`);
      
      console.log('✅ Pago anulado successfully');
      
      // Remover de la lista
      const pagoAnulado = pagos.find(p => p.id === pagoId);
      setPagos(prev => prev.filter(p => p.id !== pagoId));
      
      // Recalcular estadísticas
      if (pagoAnulado) {
        setEstadisticas(prev => ({
          ...prev,
          totalPagos: Math.max(0, prev.totalPagos - 1),
          montoCobrado: prev.montoCobrado - Number(pagoAnulado.monto),
          ultimoPago: pagos.filter(p => p.id !== pagoId)[0] || undefined,
          pagoPromedio: prev.totalPagos > 1 ? (prev.montoCobrado - Number(pagoAnulado.monto)) / (prev.totalPagos - 1) : 0
        }));
      }
    } catch (err: any) {
      console.error('❌ Error anulando pago:', err);
      throw new Error(err.message || 'Error al anular pago');
    }
  };

  const actualizarEstadisticasConVenta = (ventaInfo: VentaInfo) => {
    setEstadisticas(prev => ({
      ...prev,
      saldoPendiente: ventaInfo.saldoPendiente,
      porcentajeCobrado: ventaInfo.total > 0 ? ((ventaInfo.total - ventaInfo.saldoPendiente) / ventaInfo.total) * 100 : 0
    }));
  };

  const getPagosDelPeriodo = (fechaInicio: Date, fechaFin: Date): PagoVenta[] => {
    return pagos.filter(pago => {
      const fechaPago = new Date(pago.fecha);
      return fechaPago >= fechaInicio && fechaPago <= fechaFin;
    });
  };

  const getEstadisticasPorMedioPago = () => {
    const estadisticasPorMedio = pagos.reduce((acc, pago) => {
      const medio = pago.medioPago.nombre;
      if (!acc[medio]) {
        acc[medio] = {
          nombre: medio,
          cantidad: 0,
          monto: 0
        };
      }
      acc[medio].cantidad += 1;
      acc[medio].monto += Number(pago.monto);
      return acc;
    }, {} as Record<string, { nombre: string; cantidad: number; monto: number }>);

    return Object.values(estadisticasPorMedio).sort((a, b) => b.monto - a.monto);
  };

  useEffect(() => {
    console.log('🔄 usePagosVenta effect triggered for venta:', ventaId);
    fetchPagos();
  }, [ventaId]);

  return {
    pagos,
    loading,
    error,
    estadisticas,
    refetch: fetchPagos,
    registrarPago,
    anularPago,
    actualizarEstadisticasConVenta,
    getPagosDelPeriodo,
    getEstadisticasPorMedioPago
  };
}

// Hook para estadísticas generales de cobros
export function useEstadisticasCobros() {
  const [estadisticas, setEstadisticas] = useState<{
    totalVentasConSaldo: number;
    montoTotalPorCobrar: number;
    ventasMasAtrasadas: any[];
    promedioTiempoCobro: number;
    loading: boolean;
  }>({
    totalVentasConSaldo: 0,
    montoTotalPorCobrar: 0,
    ventasMasAtrasadas: [],
    promedioTiempoCobro: 0,
    loading: true
  });

  const fetchEstadisticas = async () => {
    try {
      console.log('📊 Fetching estadísticas de cobros...');
      
      // Obtener ventas con saldo pendiente
      const ventasConSaldo = await api.get('/api/ventas');
      const ventasData = (ventasConSaldo.data || []).filter((venta: any) => 
        Number(venta.saldoPendiente) > 0
      );
      
      const totalVentasConSaldo = ventasData.length;
      const montoTotalPorCobrar = ventasData.reduce((acc: number, venta: any) => 
        acc + Number(venta.saldoPendiente), 0);

      // Ordenar por antigüedad para obtener las más atrasadas
      const ventasMasAtrasadas = ventasData
        .sort((a: any, b: any) => new Date(a.fechaPedido).getTime() - new Date(b.fechaPedido).getTime())
        .slice(0, 5);

      setEstadisticas({
        totalVentasConSaldo,
        montoTotalPorCobrar,
        ventasMasAtrasadas,
        promedioTiempoCobro: 0, // Calcular basado en datos históricos
        loading: false
      });
      
      console.log('✅ Estadísticas de cobros loaded successfully');
    } catch (err: any) {
      console.error('❌ Error fetching estadísticas de cobros:', err);
      setEstadisticas(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  return {
    ...estadisticas,
    refetch: fetchEstadisticas
  };
}

// Hook para alertas de cobros
export function useAlertasCobros() {
  const [alertas, setAlertas] = useState<{
    ventasVencidas: any[];
    ventasProximasAVencer: any[];
    ventasSinPagos: any[];
    loading: boolean;
  }>({
    ventasVencidas: [],
    ventasProximasAVencer: [],
    ventasSinPagos: [],
    loading: true
  });

  const fetchAlertas = async () => {
    try {
      console.log('🚨 Fetching alertas de cobros...');
      
      const response = await api.get('/api/ventas');
      const ventas = (response.data || []).filter((venta: any) => 
        Number(venta.saldoPendiente) > 0
      );

      const hoy = new Date();

      // Clasificar ventas según alertas
      const ventasVencidas = ventas.filter((venta: any) => {
        const fechaCreacion = new Date(venta.fechaPedido);
        const diasTranscurridos = (hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24);
        return diasTranscurridos > 30; // Vencidas después de 30 días
      });

      const ventasProximasAVencer = ventas.filter((venta: any) => {
        const fechaCreacion = new Date(venta.fechaPedido);
        const diasTranscurridos = (hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24);
        return diasTranscurridos >= 23 && diasTranscurridos <= 30; // Entre 23 y 30 días
      });

      const ventasSinPagos = ventas.filter((venta: any) => 
        Number(venta.totalCobrado) === 0
      );

      setAlertas({
        ventasVencidas,
        ventasProximasAVencer,
        ventasSinPagos,
        loading: false
      });
      
      console.log('✅ Alertas de cobros loaded:', {
        vencidas: ventasVencidas.length,
        proximasAVencer: ventasProximasAVencer.length,
        sinPagos: ventasSinPagos.length
      });
    } catch (err: any) {
      console.error('❌ Error fetching alertas de cobros:', err);
      setAlertas(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchAlertas();
    
    // Actualizar alertas cada 5 minutos
    const interval = setInterval(fetchAlertas, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...alertas,
    refetch: fetchAlertas,
    totalAlertas: alertas.ventasVencidas.length + alertas.ventasProximasAVencer.length + alertas.ventasSinPagos.length
  };
}