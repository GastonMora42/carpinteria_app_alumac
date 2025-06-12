// src/hooks/use-dashboard.ts - CORREGIDO CON utils/http.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/http';

interface DashboardData {
  estadisticas: {
    totalClientes: number;
    totalPresupuestosPendientes: number;
    totalPedidosPendientes: number;
    ventasMes: number;
    saldosPorCobrar: number;
  };
  transaccionesRecientes: any[];
  presupuestosVencenProximamente: any[];
  pedidosEnProceso: any[];
  ventasPorDia: any[];
  resumen: {
    alertas: {
      presupuestosVencen: number;
      pedidosAtrasados: number;
    };
  };
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching dashboard data...');

      // Usar api.get que incluye automáticamente cookies
      const dashboardData = await api.get('/api/dashboard');
      
      console.log('✅ Dashboard data fetched successfully');
      console.log('📈 Stats:', dashboardData.estadisticas);
      
      setData(dashboardData);
    } catch (err: any) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.message || 'Error al cargar datos del dashboard');
      
      // Si es error de autenticación, redirigir al login
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login?from=/dashboard';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useDashboard effect triggered');
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  };
}