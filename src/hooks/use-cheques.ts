// src/hooks/use-cheques.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/http';

interface Cheque {
  id: string;
  numero: string;
  banco: string;
  sucursal?: string;
  cuit?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monto: number;
  moneda: string;
  estado: 'CARTERA' | 'DEPOSITADO' | 'COBRADO' | 'RECHAZADO' | 'ANULADO' | 'ENDOSADO';
  fechaCobro?: string;
  motivoRechazo?: string;
  cliente?: {
    id: string;
    nombre: string;
    telefono?: string;
  };
  transaccion?: {
    id: string;
    numero: string;
    concepto: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ChequeFormData {
  numero: string;
  banco: string;
  sucursal?: string;
  cuit?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monto: number;
  moneda: 'PESOS' | 'DOLARES';
  clienteId?: string;
  transaccionId?: string;
}

interface UseChequesParams {
  estado?: string;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function useCheques(params: UseChequesParams = {}) {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheques = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching cheques with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/cheques?${searchParams}`);
      
      console.log('✅ Cheques fetched successfully:', data.data?.length || 0);
      
      setCheques(data.data || []);
    } catch (err: any) {
      console.error('❌ Error fetching cheques:', err);
      setError(err.message || 'Error al cargar cheques');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createCheque = async (chequeData: ChequeFormData): Promise<Cheque> => {
    try {
      console.log('➕ Creating cheque:', chequeData.numero);
      
      const newCheque = await api.post('/api/cheques', chequeData);
      
      console.log('✅ Cheque created successfully:', newCheque.id);
      
      setCheques(prev => [newCheque, ...prev]);
      return newCheque;
    } catch (err: any) {
      console.error('❌ Error creating cheque:', err);
      throw new Error(err.message || 'Error al crear cheque');
    }
  };

  const updateEstadoCheque = async (id: string, estado: string, datos?: any): Promise<Cheque> => {
    try {
      console.log('🔄 Updating cheque estado:', id, estado);
      
      const updateData = {
        estado,
        ...datos
      };
      
      const updatedCheque = await api.put(`/api/cheques/${id}`, updateData);
      
      console.log('✅ Cheque updated successfully:', updatedCheque.id);
      
      setCheques(prev => prev.map(c => c.id === id ? updatedCheque : c));
      return updatedCheque;
    } catch (err: any) {
      console.error('❌ Error updating cheque:', err);
      throw new Error(err.message || 'Error al actualizar cheque');
    }
  };

  const deleteCheque = async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting cheque:', id);
      
      await api.delete(`/api/cheques/${id}`);
      
      console.log('✅ Cheque deleted successfully:', id);
      
      setCheques(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('❌ Error deleting cheque:', err);
      throw new Error(err.message || 'Error al eliminar cheque');
    }
  };

  useEffect(() => {
    console.log('🔄 useCheques effect triggered:', params);
    fetchCheques();
  }, [JSON.stringify(params)]);

  return {
    cheques,
    loading,
    error,
    refetch: fetchCheques,
    createCheque,
    updateEstadoCheque,
    deleteCheque
  };
}

// Hook para obtener un cheque específico
export function useCheque(id: string | null) {
  const [cheque, setCheque] = useState<Cheque | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCheque = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching cheque:', id);
        
        const data = await api.get(`/api/cheques/${id}`);
        
        console.log('✅ Cheque fetched successfully:', data.id);
        setCheque(data);
      } catch (err: any) {
        console.error('❌ Error fetching cheque:', err);
        setError(err.message || 'Error al cargar cheque');
        
        if (err.message?.includes('404')) {
          setError('Cheque no encontrado');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCheque();
  }, [id]);

  return { cheque, loading, error };
}