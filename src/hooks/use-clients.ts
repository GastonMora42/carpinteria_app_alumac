// src/hooks/use-clients.ts - CORREGIDO CON utils/http.ts
import { useState, useEffect } from 'react';
import { ClienteFormData } from '@/lib/validations/client';
import { api } from '@/lib/utils/http';

interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
  notas?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useClients({ page = 1, limit = 10, search }: UseClientsParams = {}) {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching clients with params:', { page, limit, search });
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      // Usar api.get que incluye automáticamente cookies
      const data = await api.get(`/api/clientes?${params}`);
      
      console.log('✅ Clients fetched successfully:', data.data?.length || 0);
      
      setClients(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching clients:', err);
      setError(err.message || 'Error al cargar clientes');
      
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

  const createClient = async (clientData: ClienteFormData): Promise<Cliente> => {
    try {
      console.log('➕ Creating client:', clientData.nombre);
      
      // Usar api.post que incluye automáticamente cookies
      const newClient = await api.post('/api/clientes', clientData);
      
      console.log('✅ Client created successfully:', newClient.id);
      
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (err: any) {
      console.error('❌ Error creating client:', err);
      throw new Error(err.message || 'Error al crear cliente');
    }
  };

  const updateClient = async (id: string, clientData: Partial<ClienteFormData>): Promise<Cliente> => {
    try {
      console.log('✏️ Updating client:', id);
      
      // Usar api.put que incluye automáticamente cookies
      const updatedClient = await api.put(`/api/clientes/${id}`, clientData);
      
      console.log('✅ Client updated successfully:', updatedClient.id);
      
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
      return updatedClient;
    } catch (err: any) {
      console.error('❌ Error updating client:', err);
      throw new Error(err.message || 'Error al actualizar cliente');
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting client:', id);
      
      // Usar api.delete que incluye automáticamente cookies
      await api.delete(`/api/clientes/${id}`);
      
      console.log('✅ Client deleted successfully:', id);
      
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err: any) {
      console.error('❌ Error deleting client:', err);
      throw new Error(err.message || 'Error al eliminar cliente');
    }
  };

  useEffect(() => {
    console.log('🔄 useClients effect triggered:', { page, limit, search });
    fetchClients();
  }, [page, limit, search]);

  return {
    clients,
    loading,
    error,
    pagination,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient
  };
}

// Hook para obtener un cliente específico
export function useClient(id: string | null) {
  const [client, setClient] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchClient = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching client:', id);
        
        // Usar api.get que incluye automáticamente cookies
        const data = await api.get(`/api/clientes/${id}`);
        
        console.log('✅ Client fetched successfully:', data.id);
        setClient(data);
      } catch (err: any) {
        console.error('❌ Error fetching client:', err);
        setError(err.message || 'Error al cargar cliente');
        
        // Si es error 404, cliente no encontrado
        if (err.message?.includes('404')) {
          setError('Cliente no encontrado');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  return { client, loading, error };
}