// src/hooks/use-gastos-generales.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/http';

interface GastoGeneral {
  id: string;
  numero: string;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  monto: number;
  moneda: string;
  fecha: string;
  periodo?: string;
  numeroFactura?: string;
  proveedor?: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface GastoGeneralFormData {
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  monto: number;
  moneda: 'PESOS' | 'DOLARES';
  fecha: string;
  periodo?: string;
  numeroFactura?: string;
  proveedor?: string;
}

interface UseGastosGeneralesParams {
  page?: number;
  limit?: number;
  categoria?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  periodo?: string;
}

export function useGastosGenerales(params: UseGastosGeneralesParams = {}) {
  const [gastos, setGastos] = useState<GastoGeneral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20
  });

  const fetchGastos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Fetching gastos generales with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/gastos-generales?${searchParams}`);
      
      console.log('✅ Gastos generales fetched successfully:', data.data?.length || 0);
      
      setGastos(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 20 });
    } catch (err: any) {
      console.error('❌ Error fetching gastos generales:', err);
      setError(err.message || 'Error al cargar gastos generales');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createGasto = async (gastoData: GastoGeneralFormData): Promise<GastoGeneral> => {
    try {
      console.log('➕ Creating gasto general:', gastoData.descripcion);
      
      const newGasto = await api.post('/api/gastos-generales', gastoData);
      
      console.log('✅ Gasto general created successfully:', newGasto.id);
      
      setGastos(prev => [newGasto, ...prev]);
      return newGasto;
    } catch (err: any) {
      console.error('❌ Error creating gasto general:', err);
      throw new Error(err.message || 'Error al crear gasto general');
    }
  };

  const updateGasto = async (id: string, gastoData: Partial<GastoGeneralFormData>): Promise<GastoGeneral> => {
    try {
      console.log('✏️ Updating gasto general:', id);
      
      const updatedGasto = await api.put(`/api/gastos-generales/${id}`, gastoData);
      
      console.log('✅ Gasto general updated successfully:', updatedGasto.id);
      
      setGastos(prev => prev.map(g => g.id === id ? updatedGasto : g));
      return updatedGasto;
    } catch (err: any) {
      console.error('❌ Error updating gasto general:', err);
      throw new Error(err.message || 'Error al actualizar gasto general');
    }
  };

  const deleteGasto = async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting gasto general:', id);
      
      await api.delete(`/api/gastos-generales/${id}`);
      
      console.log('✅ Gasto general deleted successfully:', id);
      
      setGastos(prev => prev.filter(g => g.id !== id));
    } catch (err: any) {
      console.error('❌ Error deleting gasto general:', err);
      throw new Error(err.message || 'Error al eliminar gasto general');
    }
  };

  useEffect(() => {
    console.log('🔄 useGastosGenerales effect triggered:', params);
    fetchGastos();
  }, [JSON.stringify(params)]);

  return {
    gastos,
    loading,
    error,
    pagination,
    refetch: fetchGastos,
    createGasto,
    updateGasto,
    deleteGasto
  };
}

// Hook para estadísticas de gastos
export function useGastosEstadisticas() {
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching gastos estadísticas...');
      
      const data = await api.get('/api/gastos-generales/estadisticas');
      
      console.log('✅ Gastos estadísticas fetched successfully');
      
      setEstadisticas(data);
    } catch (err: any) {
      console.error('❌ Error fetching gastos estadísticas:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas
  };
}