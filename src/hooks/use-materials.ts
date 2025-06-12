// ===================================

// src/hooks/use-materials.ts - NUEVO HOOK PARA MATERIALES
import { useState, useEffect } from 'react';
import { MaterialFormData, ProveedorFormData } from '@/lib/validations/material';
import { api } from '@/lib/utils/http';

interface Material {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  unidadMedida: string;
  precioUnitario: number;
  moneda: string;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  proveedor: {
    id: string;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
  activo: boolean;
  createdAt: string;
  _count?: {
    materiales: number;
  };
}

interface UseMaterialsParams {
  page?: number;
  limit?: number;
  tipo?: string;
  proveedorId?: string;
  search?: string;
  stockFilter?: 'critico' | 'bajo' | 'normal';
}

export function useMaterials(params: UseMaterialsParams = {}) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Fetching materials with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      // Usar api.get que incluye automáticamente cookies
      const data = await api.get(`/api/materiales?${searchParams}`);
      
      console.log('✅ Materials fetched successfully:', data.data?.length || 0);
      
      setMaterials(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
    } catch (err: any) {
      console.error('❌ Error fetching materials:', err);
      setError(err.message || 'Error al cargar materiales');
      
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

  const createMaterial = async (materialData: MaterialFormData): Promise<Material> => {
    try {
      console.log('➕ Creating material:', materialData.nombre);
      
      // Usar api.post que incluye automáticamente cookies
      const newMaterial = await api.post('/api/materiales', materialData);
      
      console.log('✅ Material created successfully:', newMaterial.id);
      
      setMaterials(prev => [newMaterial, ...prev]);
      return newMaterial;
    } catch (err: any) {
      console.error('❌ Error creating material:', err);
      throw new Error(err.message || 'Error al crear material');
    }
  };

  const updateMaterial = async (id: string, materialData: Partial<MaterialFormData>): Promise<Material> => {
    try {
      console.log('✏️ Updating material:', id);
      
      // Usar api.put que incluye automáticamente cookies
      const updatedMaterial = await api.put(`/api/materiales/${id}`, materialData);
      
      console.log('✅ Material updated successfully:', updatedMaterial.id);
      
      setMaterials(prev => prev.map(m => m.id === id ? updatedMaterial : m));
      return updatedMaterial;
    } catch (err: any) {
      console.error('❌ Error updating material:', err);
      throw new Error(err.message || 'Error al actualizar material');
    }
  };

  const deleteMaterial = async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting material:', id);
      
      // Usar api.delete que incluye automáticamente cookies
      await api.delete(`/api/materiales/${id}`);
      
      console.log('✅ Material deleted successfully:', id);
      
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error('❌ Error deleting material:', err);
      throw new Error(err.message || 'Error al eliminar material');
    }
  };

  const updateStock = async (id: string, movimiento: {
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    cantidad: number;
    motivo: string;
    referencia?: string;
  }): Promise<void> => {
    try {
      console.log('📦 Updating stock for material:', id, movimiento);
      
      // Usar api.post que incluye automáticamente cookies
      await api.post(`/api/materiales/${id}/movimientos`, movimiento);
      
      console.log('✅ Stock updated successfully');
      
      // Refrescar lista para obtener nuevo stock
      await fetchMaterials();
    } catch (err: any) {
      console.error('❌ Error updating stock:', err);
      throw new Error(err.message || 'Error al actualizar stock');
    }
  };

  useEffect(() => {
    console.log('🔄 useMaterials effect triggered:', params);
    fetchMaterials();
  }, [JSON.stringify(params)]);

  return {
    materials,
    loading,
    error,
    pagination,
    refetch: fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    updateStock
  };
}

// Hook para proveedores
export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏢 Fetching proveedores...');
      
      // Usar api.get que incluye automáticamente cookies
      const data = await api.get('/api/proveedores');
      
      console.log('✅ Proveedores fetched successfully:', data.data?.length || 0);
      
      setProveedores(data.data || []);
    } catch (err: any) {
      console.error('❌ Error fetching proveedores:', err);
      setError(err.message || 'Error al cargar proveedores');
      
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

  const createProveedor = async (proveedorData: ProveedorFormData): Promise<Proveedor> => {
    try {
      console.log('➕ Creating proveedor:', proveedorData.nombre);
      
      // Usar api.post que incluye automáticamente cookies
      const newProveedor = await api.post('/api/proveedores', proveedorData);
      
      console.log('✅ Proveedor created successfully:', newProveedor.id);
      
      setProveedores(prev => [newProveedor, ...prev]);
      return newProveedor;
    } catch (err: any) {
      console.error('❌ Error creating proveedor:', err);
      throw new Error(err.message || 'Error al crear proveedor');
    }
  };

  useEffect(() => {
    console.log('🔄 useProveedores effect triggered');
    fetchProveedores();
  }, []);

  return {
    proveedores,
    loading,
    error,
    refetch: fetchProveedores,
    createProveedor
  };
}

