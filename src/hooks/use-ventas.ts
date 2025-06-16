// ===================================

// src/hooks/use-ventas.ts - ACTUALIZADO CON HTTP CLIENT
import { useState, useEffect, ReactNode } from 'react';
import { VentaFormData } from '@/lib/validations/venta';
import { api } from '@/lib/utils/http';

interface Venta {
  avance: ReactNode;
  porcentajeAvance: any;
  fechaEntregaReal: any;
  id: string;
  numero: string;
  cliente: {
    telefono: any;
    id: string;
    nombre: string;
    email?: string;
  };
  fechaPedido: string;
  fechaEntrega?: string;
  estado: string;
  prioridad: string;
  total: number;
  totalCobrado: number;
  saldoPendiente: number;
  moneda: string;
  descripcionObra?: string;
  presupuesto?: {
    id: string;
    numero: string;
  };
}

interface UseVentasParams {
  page?: number;
  limit?: number;
  estado?: string;
  clienteId?: string;
  search?: string;
}

export function useVentas(params: UseVentasParams = {}) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchVentas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🛒 Fetching ventas with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      // Usar api.get que incluye automáticamente cookies
      const data = await api.get(`/api/ventas?${searchParams}`);
      
      console.log('✅ Ventas fetched successfully:', data.data?.length || 0);
      
      setVentas(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching ventas:', err);
      setError(err.message || 'Error al cargar ventas');
      
      // Si es error de autenticación, redirigir al login
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createVenta = async (ventaData: VentaFormData): Promise<Venta> => {
    try {
      console.log('➕ Creating venta:', ventaData.descripcionObra);
      
      // Usar api.post que incluye automáticamente cookies
      const newVenta = await api.post('/api/ventas', ventaData);
      
      console.log('✅ Venta created successfully:', newVenta.id);
      
      setVentas(prev => [newVenta, ...prev]);
      return newVenta;
    } catch (err: any) {
      console.error('❌ Error creating venta:', err);
      throw new Error(err.message || 'Error al crear venta');
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string): Promise<Venta> => {
    try {
      console.log('🔄 Updating venta estado:', id, nuevoEstado);
      
      // Usar api.put que incluye automáticamente cookies
      const updatedVenta = await api.put(`/api/ventas/${id}`, { estado: nuevoEstado });
      
      console.log('✅ Venta estado updated successfully:', updatedVenta.id);
      
      setVentas(prev => prev.map(v => v.id === id ? updatedVenta : v));
      return updatedVenta;
    } catch (err: any) {
      console.error('❌ Error updating venta estado:', err);
      throw new Error(err.message || 'Error al actualizar estado');
    }
  };

  useEffect(() => {
    console.log('🔄 useVentas effect triggered:', params);
    fetchVentas();
  }, [JSON.stringify(params)]);

  return {
    ventas,
    loading,
    error,
    pagination,
    refetch: fetchVentas,
    createVenta,
    updateEstado
  };
}

