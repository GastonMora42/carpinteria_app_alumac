// ===================================

// src/hooks/use-dashboard.ts
import { useState, useEffect } from 'react';

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

      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  };
}

