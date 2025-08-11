// src/hooks/use-compras-materiales.ts - HOOK CORREGIDO
import { useState, useEffect } from 'react';
import { CompraMaterialFormData } from '@/lib/validations/compra-material';
import { api } from '@/lib/utils/http';

interface CompraMaterial {
  id: string;
  numero: string;
  material: {
    id: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
  proveedor: {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  venta?: {
    id: string;
    numero: string;
    cliente: {
      nombre: string;
    };
  };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  impuestos: number;
  total: number;
  moneda: string;
  numeroFactura: string;
  cuitProveedor: string;
  fechaCompra: string;
  fechaPago?: string;
  fechaVencimiento?: string;
  estadoPago: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
  medioPago: {
    id: string;
    nombre: string;
  };
  observaciones?: string;
  archivoFactura?: string;
  archivoRecibo?: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseComprasMaterialesParams {
  page?: number;
  limit?: number;
  materialId?: string;
  proveedorId?: string;
  ventaId?: string;
  estadoPago?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function useComprasMateriales(params: UseComprasMaterialesParams = {}) {
  const [compras, setCompras] = useState<CompraMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20
  });

  const fetchCompras = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🛒 Fetching compras de materiales with params:', params);
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const data = await api.get(`/api/compras-materiales?${searchParams}`);
      
      console.log('✅ Compras de materiales fetched successfully:', data.data?.length || 0);
      
      setCompras(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 20 });
    } catch (err: any) {
      console.error('❌ Error fetching compras de materiales:', err);
      setError(err.message || 'Error al cargar compras de materiales');
      
      if (err.message?.includes('Token') || err.message?.includes('401')) {
        console.log('🔄 Redirecting to login due to auth error');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const createCompra = async (compraData: CompraMaterialFormData): Promise<CompraMaterial> => {
    try {
      console.log('➕ Creating compra de material:', {
        material: compraData.materialId,
        proveedor: compraData.proveedorId,
        factura: compraData.numeroFactura,
        cantidad: compraData.cantidad,
        total: compraData.cantidad * compraData.precioUnitario
      });
      
      const newCompra = await api.post('/api/compras-materiales', compraData);
      
      console.log('✅ Compra de material created successfully:', newCompra.numero);
      
      setCompras(prev => [newCompra, ...prev]);
      return newCompra;
    } catch (err: any) {
      console.error('❌ Error creating compra de material:', err);
      throw new Error(err.message || 'Error al crear compra de material');
    }
  };

  const updateEstadoPago = async (id: string, estadoPago: string, fechaPago?: Date): Promise<CompraMaterial> => {
    try {
      console.log('🔄 Updating estado de pago:', { id, estadoPago, fechaPago });
      
      const updateData = {
        estadoPago,
        ...(fechaPago && { fechaPago: fechaPago.toISOString() })
      };
      
      const updatedCompra = await api.put(`/api/compras-materiales/${id}`, updateData);
      
      console.log('✅ Estado de pago updated successfully:', updatedCompra.id);
      
      setCompras(prev => prev.map(c => c.id === id ? updatedCompra : c));
      return updatedCompra;
    } catch (err: any) {
      console.error('❌ Error updating estado de pago:', err);
      throw new Error(err.message || 'Error al actualizar estado de pago');
    }
  };

  const generateReciboPDF = async (id: string): Promise<void> => {
    try {
      console.log('📄 Generating recibo PDF for compra:', id);
      
      // Crear una nueva ventana/tab para mostrar el PDF
      const pdfUrl = `/api/compras-materiales/${id}/pdf`;
      window.open(pdfUrl, '_blank');
      
      console.log('✅ PDF generation initiated');
    } catch (err: any) {
      console.error('❌ Error generating PDF:', err);
      throw new Error(err.message || 'Error al generar PDF del recibo');
    }
  };

  const deleteCompra = async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting compra de material:', id);
      
      await api.delete(`/api/compras-materiales/${id}`);
      
      console.log('✅ Compra de material deleted successfully:', id);
      
      setCompras(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('❌ Error deleting compra de material:', err);
      throw new Error(err.message || 'Error al eliminar compra de material');
    }
  };

  useEffect(() => {
    console.log('🔄 useComprasMateriales effect triggered:', params);
    fetchCompras();
  }, [JSON.stringify(params)]);

  return {
    compras,
    loading,
    error,
    pagination,
    refetch: fetchCompras,
    createCompra,
    updateEstadoPago,
    generateReciboPDF,
    deleteCompra
  };
}

// Hook para obtener una compra específica
export function useCompraMaterial(id: string | null) {
  const [compra, setCompra] = useState<CompraMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCompra = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching compra de material:', id);
        
        const data = await api.get(`/api/compras-materiales/${id}`);
        
        console.log('✅ Compra de material fetched successfully:', data.numero);
        setCompra(data);
      } catch (err: any) {
        console.error('❌ Error fetching compra de material:', err);
        setError(err.message || 'Error al cargar compra de material');
        
        if (err.message?.includes('404')) {
          setError('Compra de material no encontrada');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCompra();
  }, [id]);

  return { compra, loading, error };
}

// Hook para estadísticas de compras - CORREGIDO CON TODAS LAS PROPIEDADES
export function useEstadisticasCompras() {
  const [estadisticas, setEstadisticas] = useState<{
    totalCompras: number;
    montoTotalCompras: number;
    comprasPendientesPago: number;
    montoPendientePago: number;
    comprasEsteAño: number;
    pagosProximosVencer: number;
    pagosVencidos: number; // ✅ AGREGADO
    comprasPorMes: Array<{
      mes: string;
      cantidad: number;
      monto: number;
    }>;
    materialesMasComprados: Array<{
      material: string;
      codigo: string;
      cantidadCompras: number;
      cantidadTotal: number;
      montoTotal: number;
    }>;
    proveedoresPrincipales: Array<{
      proveedor: string;
      codigo: string;
      compras: number;
      montoTotal: number;
      promedioCompra: number;
    }>;
    loading: boolean;
  }>({
    totalCompras: 0,
    montoTotalCompras: 0,
    comprasPendientesPago: 0,
    montoPendientePago: 0,
    comprasEsteAño: 0,
    pagosProximosVencer: 0,
    pagosVencidos: 0, // ✅ INICIALIZADO
    comprasPorMes: [],
    materialesMasComprados: [],
    proveedoresPrincipales: [],
    loading: true
  });

  const fetchEstadisticas = async () => {
    try {
      console.log('📊 Fetching estadísticas de compras...');
      
      const data = await api.get('/api/compras-materiales/estadisticas');
      
      console.log('✅ Estadísticas de compras fetched successfully');
      
      setEstadisticas({
        totalCompras: data.totalCompras || 0,
        montoTotalCompras: data.montoTotalCompras || 0,
        comprasPendientesPago: data.comprasPendientesPago || 0,
        montoPendientePago: data.montoPendientePago || 0,
        comprasEsteAño: data.comprasEsteAño || 0,
        pagosProximosVencer: data.pagosProximosVencer || 0,
        pagosVencidos: data.pagosVencidos || 0, // ✅ MAPEADO CORRECTAMENTE
        comprasPorMes: data.comprasPorMes || [],
        materialesMasComprados: data.materialesMasComprados || [],
        proveedoresPrincipales: data.proveedoresPrincipales || [],
        loading: false
      });
    } catch (err: any) {
      console.error('❌ Error fetching estadísticas de compras:', err);
      setEstadisticas(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  return {
    ...estadisticas,
    refetch: fetchEstadisticas
  };
}

// Hook para alertas de pagos pendientes
export function useAlertasPagosProveedores() {
  const [alertas, setAlertas] = useState<{
    pagosPendientes: CompraMaterial[];
    pagosVencidos: CompraMaterial[];
    pagosProximosVencer: CompraMaterial[];
    loading: boolean;
  }>({
    pagosPendientes: [],
    pagosVencidos: [],
    pagosProximosVencer: [],
    loading: true
  });

  const fetchAlertas = async () => {
    try {
      console.log('🚨 Fetching alertas de pagos a proveedores...');
      
      const [pendientes, vencidos, proximosVencer] = await Promise.all([
        api.get('/api/compras-materiales?estadoPago=PENDIENTE'),
        api.get('/api/compras-materiales?estadoPago=VENCIDO'),
        api.get('/api/compras-materiales?proximosVencer=true')
      ]);
      
      setAlertas({
        pagosPendientes: pendientes.data || [],
        pagosVencidos: vencidos.data || [],
        pagosProximosVencer: proximosVencer.data || [],
        loading: false
      });
      
      console.log('✅ Alertas de pagos loaded:', {
        pendientes: pendientes.data?.length || 0,
        vencidos: vencidos.data?.length || 0,
        proximosVencer: proximosVencer.data?.length || 0
      });
    } catch (err: any) {
      console.error('❌ Error fetching alertas de pagos:', err);
      setAlertas(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchAlertas();
    
    // Actualizar alertas cada 10 minutos
    const interval = setInterval(fetchAlertas, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...alertas,
    refetch: fetchAlertas,
    totalAlertas: alertas.pagosPendientes.length + alertas.pagosVencidos.length + alertas.pagosProximosVencer.length
  };
}