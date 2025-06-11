// ===================================

// src/hooks/use-transacciones.ts
import { useState, useEffect } from 'react';
import { TransaccionFormData } from '@/lib/validations/transaccion';

interface Transaccion {
  id: string;
  numero: string;
  tipo: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  moneda: string;
  fecha: string;
  cliente?: { id: string; nombre: string };
  proveedor?: { id: string; nombre: string };
  pedido?: { id: string; numero: string };
  medioPago: { id: string; nombre: string };
}

interface UseTransaccionesParams {
  page?: number;
  limit?: number;
  tipo?: string;
  clienteId?: string;
  pedidoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function useTransacciones(params: UseTransaccionesParams = {}) {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchTransacciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/transacciones?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar transacciones');
      }

      const data = await response.json();
      setTransacciones(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createTransaccion = async (transaccionData: TransaccionFormData) => {
    try {
      const response = await fetch('/api/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaccionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear transacción');
      }

      const newTransaccion = await response.json();
      setTransacciones(prev => [newTransaccion, ...prev]);
      return newTransaccion;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchTransacciones();
  }, [JSON.stringify(params)]);

  return {
    transacciones,
    loading,
    error,
    pagination,
    refetch: fetchTransacciones,
    createTransaccion
  };
}

