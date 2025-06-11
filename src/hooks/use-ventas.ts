// ===================================

// src/hooks/use-ventas.ts
import { useState, useEffect } from 'react';
import { VentaFormData } from '@/lib/validations/venta';

interface Venta {
  id: string;
  numero: string;
  cliente: {
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
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/ventas?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar ventas');
      }

      const data = await response.json();
      setVentas(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createVenta = async (ventaData: VentaFormData) => {
    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear venta');
      }

      const newVenta = await response.json();
      setVentas(prev => [newVenta, ...prev]);
      return newVenta;
    } catch (err) {
      throw err;
    }
  };

  const updateEstado = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/ventas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar estado');
      }

      const updated = await response.json();
      setVentas(prev => prev.map(v => v.id === id ? updated : v));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
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

