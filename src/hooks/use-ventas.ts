// src/hooks/use-ventas.ts - ACTUALIZADO CON ITEMS
import { useState, useEffect } from 'react';
import { VentaFormData } from '@/lib/validations/venta';
import { api } from '@/lib/utils/http';

interface ItemVenta {
  id: string;
  orden: number;
  descripcion: string;
  detalle?: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  descuento: number;
  total: number;
}

interface Venta {
  id: string;
  numero: string;
  cliente: {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  fechaPedido: string;
  fechaEntrega?: string;
  fechaEntregaReal?: string;
  estado: string;
  prioridad: string;
  total: number;
  totalCobrado: number;
  saldoPendiente: number;
  moneda: string;
  descripcionObra?: string;
  porcentajeAvance: number;
  presupuesto?: {
    id: string;
    numero: string;
  };
  items?: ItemVenta[];
  _count?: {
    transacciones: number;
    materiales: number;
    items: number;
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

      const data = await api.get(`/api/ventas?${searchParams}`);
      
      console.log('✅ Ventas fetched successfully:', data.data?.length || 0);
      
      setVentas(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching ventas:', err);
      setError(err.message || 'Error al cargar ventas');
      
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
      console.log('📋 Venta data:', {
        clienteId: ventaData.clienteId,
        presupuestoId: ventaData.presupuestoId,
        itemsCount: ventaData.items?.length || 0,
        total: ventaData.items?.reduce((acc, item) => 
          acc + (item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100)), 0
        ) || 0
      });
      
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
      
      const updatedVenta = await api.put(`/api/ventas/${id}`, { estado: nuevoEstado });
      
      console.log('✅ Venta estado updated successfully:', updatedVenta.id);
      
      setVentas(prev => prev.map(v => v.id === id ? updatedVenta : v));
      return updatedVenta;
    } catch (err: any) {
      console.error('❌ Error updating venta estado:', err);
      throw new Error(err.message || 'Error al actualizar estado');
    }
  };

  const updateAvance = async (id: string, porcentajeAvance: number): Promise<Venta> => {
    try {
      console.log('📈 Updating venta avance:', id, porcentajeAvance);
      
      const updatedVenta = await api.put(`/api/ventas/${id}`, { porcentajeAvance });
      
      console.log('✅ Venta avance updated successfully:', updatedVenta.id);
      
      setVentas(prev => prev.map(v => v.id === id ? updatedVenta : v));
      return updatedVenta;
    } catch (err: any) {
      console.error('❌ Error updating venta avance:', err);
      throw new Error(err.message || 'Error al actualizar avance');
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
    updateEstado,
    updateAvance
  };
}

// Hook para obtener una venta específica con todos sus detalles
export function useVenta(id: string | null) {
  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchVenta = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching venta:', id);
        
        const data = await api.get(`/api/ventas/${id}`);
        
        console.log('✅ Venta fetched successfully:', data.id);
        console.log('📋 Items count:', data.items?.length || 0);
        
        setVenta(data);
      } catch (err: any) {
        console.error('❌ Error fetching venta:', err);
        setError(err.message || 'Error al cargar venta');
        
        if (err.message?.includes('404')) {
          setError('Venta no encontrada');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVenta();
  }, [id]);

  return { venta, loading, error };
}