// ===================================

// src/hooks/use-presupuestos.ts
import { useState, useEffect } from 'react';
import { PresupuestoFormData } from '@/lib/validations/presupuesto';

interface Presupuesto {
  id: string;
  numero: string;
  cliente: {
    id: string;
    nombre: string;
    email?: string;
  };
  fechaEmision: string;
  fechaValidez: string;
  estado: string;
  total: number;
  moneda: string;
  descripcionObra?: string;
  items: any[];
}

interface UsePresupuestosParams {
  page?: number;
  limit?: number;
  estado?: string;
  clienteId?: string;
  search?: string;
}

export function usePresupuestos(params: UsePresupuestosParams = {}) {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchPresupuestos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/presupuestos?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar presupuestos');
      }

      const data = await response.json();
      setPresupuestos(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createPresupuesto = async (presupuestoData: PresupuestoFormData) => {
    try {
      const response = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presupuestoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear presupuesto');
      }

      const newPresupuesto = await response.json();
      setPresupuestos(prev => [newPresupuesto, ...prev]);
      return newPresupuesto;
    } catch (err) {
      throw err;
    }
  };

  const updatePresupuesto = async (id: string, data: Partial<PresupuestoFormData>) => {
    try {
      const response = await fetch(`/api/presupuestos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar presupuesto');
      }

      const updated = await response.json();
      setPresupuestos(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const convertirAVenta = async (id: string) => {
    try {
      const response = await fetch(`/api/presupuestos/${id}/convertir`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al convertir presupuesto');
      }

      const pedido = await response.json();
      
      // Actualizar estado del presupuesto en la lista
      setPresupuestos(prev => prev.map(p => 
        p.id === id ? { ...p, estado: 'CONVERTIDO' } : p
      ));
      
      return pedido;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPresupuestos();
  }, [JSON.stringify(params)]);

  return {
    presupuestos,
    loading,
    error,
    pagination,
    refetch: fetchPresupuestos,
    createPresupuesto,
    updatePresupuesto,
    convertirAVenta
  };
}

