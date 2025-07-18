// src/app/(auth)/ventas/nueva/page.tsx - MEJORADO PARA MANTENER TODOS LOS CAMPOS
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/use-clients';
import { useVentas } from '@/hooks/use-ventas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { VentaFormData, ItemVentaFormData, ventaSchema } from '@/lib/validations/venta';
import { CurrencyUtils, CalculationUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCalculator,
  HiOutlineCheckCircle,
  HiOutlineClipboard,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineExclamation
} from 'react-icons/hi';

// Hook personalizado para presupuestos disponibles
function usePresupuestosDisponibles() {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [debug, setDebug] = useState<any>(null);

  const fetchPresupuestos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/presupuestos/disponibles', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Presupuestos disponibles response:', data);
        
        setPresupuestos(data.data || []);
        setEstadisticas(data.estadisticas || null);
        setDebug(data.debug || null);
        
        // Log para debugging
        if (data.debug) {
          console.log('🔍 Debug info:', data.debug);
        }
      } else {
        throw new Error('Error al cargar presupuestos');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error fetching presupuestos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresupuestos();
  }, []);

  return { presupuestos, loading, error, estadisticas, debug, refetch: fetchPresupuestos };
}

// Componente para seleccionar presupuesto
function PresupuestoSelector({ 
  selectedId, 
  onSelect, 
  onClear, 
  presupuestos, 
  loading,
  debug 
}: {
  selectedId: string;
  onSelect: (presupuesto: any) => void;
  onClear: () => void;
  presupuestos: any[];
  loading: boolean;
  debug?: any;
}) {
  const [showModal, setShowModal] = useState(false);
  const selectedPresupuesto = presupuestos.find(p => p.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Presupuesto Origen (Opcional)
        </label>
        <div className="flex items-center space-x-2">
          {presupuestos.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              <HiOutlineEye className="h-4 w-4 mr-2" />
              Ver Disponibles ({presupuestos.length})
            </Button>
          )}
          {debug && (
            <div className="text-xs text-gray-500">
              Total en sistema: {debug.totalPresupuestosEnSistema}
            </div>
          )}
        </div>
      </div>

      {selectedPresupuesto ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <HiOutlineDocumentText className="h-5 w-5 mr-2" />
                {selectedPresupuesto.numero}
                {selectedPresupuesto.vencido && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    <HiOutlineExclamation className="h-3 w-3 mr-1" />
                    Vencido
                  </span>
                )}
                {selectedPresupuesto.urgente && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <HiOutlineClock className="h-3 w-3 mr-1" />
                    Urgente
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Cliente:</span>
                  <p className="text-blue-900">{selectedPresupuesto.cliente.nombre}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Total:</span>
                  <p className="text-blue-900 font-bold">
                    {CurrencyUtils.formatAmount(selectedPresupuesto.total, selectedPresupuesto.moneda)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Estado:</span>
                  <p className="text-blue-900">{selectedPresupuesto.estado}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Descripción:</span>
                  <p className="text-blue-900 text-sm">{selectedPresupuesto.descripcionObra}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Vencimiento:</span>
                  <p className={`font-medium ${selectedPresupuesto.vencido ? 'text-red-600' : selectedPresupuesto.urgente ? 'text-yellow-600' : 'text-blue-900'}`}>
                    {DateUtils.formatDate(selectedPresupuesto.fechaValidez)}
                    {selectedPresupuesto.diasRestantes > 0 ? 
                      ` (${selectedPresupuesto.diasRestantes} días)` : 
                      ` (vencido hace ${Math.abs(selectedPresupuesto.diasRestantes)} días)`
                    }
                  </p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-blue-600 hover:text-blue-700"
            >
              <HiOutlineTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                const presupuesto = presupuestos.find(p => p.id === e.target.value);
                if (presupuesto) onSelect(presupuesto);
              }
            }}
            disabled={loading}
          >
            <option value="">
              {loading ? 'Cargando presupuestos...' : 'Venta directa (sin presupuesto)'}
            </option>
            {presupuestos.map(presupuesto => (
              <option key={presupuesto.id} value={presupuesto.id}>
                {presupuesto.numero} - {presupuesto.cliente.nombre} - {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda)}
                {presupuesto.vencido && ' ⚠️ VENCIDO'}
                {presupuesto.urgente && ' ⏰ URGENTE'}
              </option>
            ))}
          </Select>
          
          {/* Mensaje informativo si no hay presupuestos */}
          {!loading && presupuestos.length === 0 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <HiOutlineExclamationCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">No hay presupuestos disponibles</p>
                  <p className="text-xs text-yellow-700">
                    {debug ? (
                      <>Total de presupuestos en sistema: {debug.totalPresupuestosEnSistema}. 
                      Criterios: Estados permitidos ({debug.criteriosBusqueda.estados.join(', ')}), 
                      sin pedido asociado, no vencidos hace más de 7 días.</>
                    ) : (
                      'Los presupuestos deben estar en estado PENDIENTE, ENVIADO o APROBADO y no estar ya convertidos.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de presupuestos disponibles */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Presupuestos Disponibles para Conversión
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                    <HiOutlineExclamationCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {presupuestos.map((presupuesto) => (
                    <div
                      key={presupuesto.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        presupuesto.vencido ? 'border-red-200 bg-red-50' : 
                        presupuesto.urgente ? 'border-yellow-200 bg-yellow-50' : 
                        'border-gray-200'
                      }`}
                      onClick={() => {
                        onSelect(presupuesto);
                        setShowModal(false);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">{presupuesto.numero}</h4>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              presupuesto.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                              presupuesto.estado === 'ENVIADO' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {presupuesto.estado}
                            </span>
                            {presupuesto.vencido && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Vencido
                              </span>
                            )}
                            {presupuesto.urgente && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Urgente
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{presupuesto.cliente.nombre}</p>
                          <p className="text-xs text-gray-500 mt-1 max-w-md truncate">{presupuesto.descripcionObra}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Vence: {DateUtils.formatDate(presupuesto.fechaValidez)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {presupuesto._count.items} items
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const { clients } = useClients();
  const { createVenta } = useVentas();
  const { presupuestos, loading: presupuestosLoading, estadisticas, debug } = usePresupuestosDisponibles();

  const [formData, setFormData] = useState<VentaFormData>({
    clienteId: '',
    presupuestoId: '',
    fechaEntrega: new Date(),
    prioridad: 'NORMAL',
    descripcionObra: '',
    observaciones: '',
    condicionesPago: '',
    lugarEntrega: '',
    descuento: 0,
    impuestos: 21,
    moneda: 'PESOS',
    items: [{
      descripcion: '',
      detalle: '',
      cantidad: 1,
      unidad: 'unidad',
      precioUnitario: 0,
      descuento: 0
    }]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<any>(null);
  const [ventaDirecta, setVentaDirecta] = useState(true);

  // Calcular totales basado en items o presupuesto
  const totales = selectedPresupuesto 
    ? {
        subtotal: Number(selectedPresupuesto.subtotal),
        descuentoTotal: Number(selectedPresupuesto.descuento) || 0,
        impuestos: Number(selectedPresupuesto.impuestos) || 0,
        total: Number(selectedPresupuesto.total)
      }
    : CalculationUtils.calculateOrderTotals(
        formData.items || [],
        formData.descuento,
        formData.impuestos
      );

  // FUNCIÓN MEJORADA: Manejar selección de presupuesto manteniendo TODOS los campos
  const handlePresupuestoSelect = (presupuesto: any) => {
    console.log('📋 Seleccionando presupuesto completo:', presupuesto);
    
    setSelectedPresupuesto(presupuesto);
    setVentaDirecta(false);
    
    // Copiar TODOS los campos relevantes del presupuesto
    setFormData(prev => ({
      ...prev,
      presupuestoId: presupuesto.id,
      clienteId: presupuesto.cliente.id,
      descripcionObra: presupuesto.descripcionObra || '',
      observaciones: presupuesto.observaciones || '',
      condicionesPago: presupuesto.condicionesPago || '',
      tiempoEntrega: presupuesto.tiempoEntrega || '', // Si existe en el presupuesto
      moneda: presupuesto.moneda as 'PESOS' | 'DOLARES',
      descuento: Number(presupuesto.descuento) || 0,
      impuestos: Number(presupuesto.impuestos) || 0,
      // Mantener fecha de entrega o calcular basada en tiempo de entrega
      fechaEntrega: presupuesto.tiempoEntrega ? 
        CalculationUtils.calcularFechaEntregaFromString(new Date(), presupuesto.tiempoEntrega) : 
        prev.fechaEntrega,
      items: [] // Limpiar items ya que vienen del presupuesto
    }));

    console.log('✅ Presupuesto aplicado a la venta con todos los campos');
  };

  // Limpiar selección de presupuesto
  const handlePresupuestoClear = () => {
    setSelectedPresupuesto(null);
    setVentaDirecta(true);
    setFormData(prev => ({
      ...prev,
      presupuestoId: '',
      clienteId: '',
      descripcionObra: '',
      observaciones: '',
      condicionesPago: '',
      lugarEntrega: '',
      moneda: 'PESOS',
      descuento: 0,
      impuestos: 21,
      fechaEntrega: new Date(),
      items: [{
        descripcion: '',
        detalle: '',
        cantidad: 1,
        unidad: 'unidad',
        precioUnitario: 0,
        descuento: 0
      }]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const dataToSubmit = {
        ...formData,
        items: ventaDirecta ? formData.items : undefined
      };

      const validatedData = ventaSchema.parse(dataToSubmit);
      const newVenta = await createVenta(validatedData);
      router.push(`/ventas/${newVenta.id}`);
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path?.[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message || 'Error al crear venta' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof VentaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), {
        descripcion: '',
        detalle: '',
        cantidad: 1,
        unidad: 'unidad',
        precioUnitario: 0,
        descuento: 0
      }]
    }));
  };

  const removeItem = (index: number) => {
    if ((formData.items?.length || 0) > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const updateItem = (index: number, field: keyof ItemVentaFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) => i === index ? { ...item, [field]: value } : item) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
            <p className="text-gray-600">Crea una nueva venta directa o desde un presupuesto</p>
          </div>
        </div>
      </div>

      {/* Estadísticas de presupuestos disponibles */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <HiOutlineDocumentText className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-500">Disponibles</p>
                  <p className="text-lg font-bold text-gray-900">{estadisticas.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <HiOutlineClock className="h-6 w-6 text-red-600" />
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-500">Urgentes</p>
                  <p className="text-lg font-bold text-red-600">{estadisticas.urgentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Valor Total</p>
                <p className="text-sm font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(estadisticas.montoTotal)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Aprobados</p>
                <p className="text-sm font-bold text-green-600">{estadisticas.porEstado?.aprobados || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <HiOutlineExclamationCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{errors.general}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineUsers className="h-5 w-5 mr-2" />
              Información del Cliente y Origen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de presupuesto mejorado */}
            <PresupuestoSelector
              selectedId={selectedPresupuesto?.id || ''}
              onSelect={handlePresupuestoSelect}
              onClear={handlePresupuestoClear}
              presupuestos={presupuestos}
              loading={presupuestosLoading}
              debug={debug}
            />

            <Select
              label="Cliente *"
              value={formData.clienteId}
              onChange={(e) => handleChange('clienteId', e.target.value)}
              error={errors.clienteId}
              disabled={!!selectedPresupuesto}
            >
              <option value="">Seleccionar cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {/* Detalles del pedido - SIEMPRE VISIBLE Y EDITABLE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalendar className="h-5 w-5 mr-2" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Entrega"
                type="date"
                value={formData.fechaEntrega?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleChange('fechaEntrega', new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
              />

              <Select
                label="Prioridad"
                value={formData.prioridad}
                onChange={(e) => handleChange('prioridad', e.target.value)}
              >
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </Select>
            </div>

            <Input
              label="Descripción de la Obra *"
              value={formData.descripcionObra}
              onChange={(e) => handleChange('descripcionObra', e.target.value)}
              error={errors.descripcionObra}
              placeholder="Describe el trabajo a realizar..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Condiciones de Pago"
                value={formData.condicionesPago}
                onChange={(e) => handleChange('condicionesPago', e.target.value)}
                placeholder="ej: 50% anticipo, 50% contra entrega"
              />

              <Input
                label="Lugar de Entrega"
                value={formData.lugarEntrega}
                onChange={(e) => handleChange('lugarEntrega', e.target.value)}
                placeholder="Dirección de entrega"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional del pedido..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Items de la venta (solo para venta directa) */}
        {ventaDirecta && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <HiOutlineDocumentText className="h-5 w-5 mr-2" />
                  Items de la Venta
                </CardTitle>
                <Button type="button" variant="outline" onClick={addItem}>
                  <HiOutlinePlus className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.items || []).map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Item #{index + 1}</h4>
                    {(formData.items?.length || 0) > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                    <div className="md:col-span-2">
                      <Input
                        label="Descripción *"
                        value={item.descripcion}
                        onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del item"
                      />
                    </div>

                    <Input
                      label="Cantidad"
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => updateItem(index, 'cantidad', Number(e.target.value))}
                      min="0.001"
                      step="0.001"
                    />

                    <Input
                      label="Unidad"
                      value={item.unidad}
                      onChange={(e) => updateItem(index, 'unidad', e.target.value)}
                      placeholder="m2, metro, unidad"
                    />

                    <Input
                      label="Precio Unit."
                      type="number"
                      value={item.precioUnitario}
                      onChange={(e) => updateItem(index, 'precioUnitario', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />

                    <Input
                      label="Desc. %"
                      type="number"
                      value={item.descuento}
                      onChange={(e) => updateItem(index, 'descuento', Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>

                  <Input
                    label="Detalle"
                    value={item.detalle}
                    onChange={(e) => updateItem(index, 'detalle', e.target.value)}
                    placeholder="Información adicional del item"
                  />

                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        Total: {CurrencyUtils.formatAmount(
                          CalculationUtils.calculateItemTotal(item.cantidad, item.precioUnitario, item.descuento),
                          formData.moneda
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Totales y configuración final */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalculator className="h-5 w-5 mr-2" />
              Totales y Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ventaDirecta && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Descuento General (%)"
                      type="number"
                      value={formData.descuento}
                      onChange={(e) => handleChange('descuento', Number(e.target.value))}
                      min="0"
                      max="100"
                    />

                    <Input
                      label="Impuestos (%)"
                      type="number"
                      value={formData.impuestos}
                      onChange={(e) => handleChange('impuestos', Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>

                  <Select
                    label="Moneda"
                    value={formData.moneda}
                    onChange={(e) => handleChange('moneda', e.target.value)}
                  >
                    <option value="PESOS">Pesos Argentinos</option>
                    <option value="DOLARES">Dólares</option>
                  </Select>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">
                  Resumen de Totales
                  {selectedPresupuesto && (
                    <span className="text-sm text-blue-600 ml-2">
                      (desde presupuesto {selectedPresupuesto.numero})
                    </span>
                  )}
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{CurrencyUtils.formatAmount(totales.subtotal, formData.moneda)}</span>
                  </div>
                  {totales.descuentoTotal > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-{CurrencyUtils.formatAmount(totales.descuentoTotal, formData.moneda)}</span>
                    </div>
                  )}
                  {totales.impuestos > 0 && (
                    <div className="flex justify-between">
                      <span>Impuestos:</span>
                      <span>{CurrencyUtils.formatAmount(totales.impuestos, formData.moneda)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      {CurrencyUtils.formatAmount(totales.total, formData.moneda)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => router.back()} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {selectedPresupuesto ? (
              <>
                <HiOutlineCheckCircle className="h-4 w-4 mr-2" />
                Convertir a Venta
              </>
            ) : (
              'Crear Venta'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}