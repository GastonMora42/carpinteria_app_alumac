// src/hooks/use-clients.ts
import { useState, useEffect } from 'react';
import { ClienteFormData } from '@/lib/validations/client';

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
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/api/clientes?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();
      setClients(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: ClienteFormData) => {
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear cliente');
      }

      const newClient = await response.json();
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (err) {
      throw err;
    }
  };

  const updateClient = async (id: string, clientData: Partial<ClienteFormData>) => {
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar cliente');
      }

      const updatedClient = await response.json();
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ));
      return updatedClient;
    } catch (err) {
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar cliente');
      }

      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
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

        const response = await fetch(`/api/clientes/${id}`);
        
        if (!response.ok) {
          throw new Error('Cliente no encontrado');
        }

        const data = await response.json();
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  return { client, loading, error };
}

