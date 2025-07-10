// src/hooks/use-presupuestos.ts - ACTUALIZADO
import { useState, useEffect } from 'react';
import { PresupuestoFormData } from '@/lib/validations/presupuesto';
import { api } from '@/lib/utils/http';
import { convertDecimalFields, PresupuestoWithNumbers } from '@/lib/types/prisma-overrides';

interface UsePresupuestosParams {
  page?: number;
  limit?: number;
  estado?: string;
  clienteId?: string;
  search?: string;
}

export function usePresupuestos(params: UsePresupuestosParams = {}) {
  const [presupuestos, setPresupuestos] = useState<PresupuestoWithNumbers[]>([]);
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
      
      console.log('📋 Fetching presupuestos with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/presupuestos?${searchParams}`);
      
      console.log('✅ Presupuestos fetched successfully:', data.data?.length || 0);
      
      // Convertir campos Decimal a number
      const convertedPresupuestos = (data.data || []).map((presupuesto: any) => 
        convertDecimalFields(presupuesto, ['subtotal', 'descuento', 'impuestos', 'total'])
      );
      
      setPresupuestos(convertedPresupuestos);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching presupuestos:', err);
      setError(err.message || 'Error al cargar presupuestos');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createPresupuesto = async (presupuestoData: PresupuestoFormData): Promise<PresupuestoWithNumbers> => {
    try {
      console.log('➕ Creating presupuesto:', presupuestoData.descripcionObra);
      
      const newPresupuesto = await api.post('/api/presupuestos', presupuestoData);
      
      console.log('✅ Presupuesto created successfully:', newPresupuesto.id);
      
      // Convertir campos Decimal a number
      const convertedPresupuesto = convertDecimalFields(newPresupuesto, ['subtotal', 'descuento', 'impuestos', 'total']);
      
      setPresupuestos(prev => [convertedPresupuesto, ...prev]);
      return convertedPresupuesto;
    } catch (err: any) {
      console.error('❌ Error creating presupuesto:', err);
      throw new Error(err.message || 'Error al crear presupuesto');
    }
  };

  const updatePresupuesto = async (id: string, data: Partial<PresupuestoFormData>): Promise<PresupuestoWithNumbers> => {
    try {
      console.log('✏️ Updating presupuesto:', id);
      
      const updatedPresupuesto = await api.put(`/api/presupuestos/${id}`, data);
      
      console.log('✅ Presupuesto updated successfully:', updatedPresupuesto.id);
      
      // Convertir campos Decimal a number
      const convertedPresupuesto = convertDecimalFields(updatedPresupuesto, ['subtotal', 'descuento', 'impuestos', 'total']);
      
      setPresupuestos(prev => prev.map(p => p.id === id ? convertedPresupuesto : p));
      return convertedPresupuesto;
    } catch (err: any) {
      console.error('❌ Error updating presupuesto:', err);
      throw new Error(err.message || 'Error al actualizar presupuesto');
    }
  };

  const convertirAVenta = async (id: string) => {
    try {
      console.log('🔄 Converting presupuesto to sale:', id);
      
      const pedido = await api.post(`/api/presupuestos/${id}/convertir`);
      
      console.log('✅ Presupuesto converted successfully:', pedido.id);
      
      setPresupuestos(prev => prev.map(p => 
        p.id === id ? { ...p, estado: 'CONVERTIDO' } : p
      ));
      
      return pedido;
    } catch (err: any) {
      console.error('❌ Error converting presupuesto:', err);
      throw new Error(err.message || 'Error al convertir presupuesto');
    }
  };

  useEffect(() => {
    console.log('🔄 usePresupuestos effect triggered:', params);
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