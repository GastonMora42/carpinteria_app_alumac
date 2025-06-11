// src/app/(auth)/presupuestos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePresupuestos } from '@/hooks/use-presupuestos';
import { useClients } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { PresupuestoFormData, ItemPresupuestoFormData, presupuestoSchema } from '@/lib/validations/presupuesto';
import { CurrencyUtils, DateUtils, CalculationUtils, Currency } from '@/lib/utils/calculations';
import { ESTADOS_PRESUPUESTO } from '@/lib/utils/validators';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckCircle
} from 'react-icons/hi';

interface PresupuestoFormProps {
  isOpen: boolean;
  onClose: () => void;
  presupuesto?: any;
  onSubmit: (data: PresupuestoFormData) => Promise<void>;
}

function PresupuestoForm({ isOpen, onClose, presupuesto, onSubmit }: PresupuestoFormProps) {
  const { clients } = useClients();
  const [formData, setFormData] = useState<PresupuestoFormData>({
    clienteId: '',
    fechaValidez: new Date(),
    descripcionObra: '',
    observaciones: '',
    condicionesPago: '',
    tiempoEntrega: '',
    validezDias: 30,
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

  // Calcular totales
  const totales = CalculationUtils.calculateOrderTotals(
    formData.items,
    formData.descuento,
    formData.impuestos
  );

  useEffect(() => {
    if (presupuesto) {
      const fechaValidez = new Date(presupuesto.fechaValidez);
      setFormData({
        clienteId: presupuesto.clienteId,
        fechaValidez,
        descripcionObra: presupuesto.descripcionObra || '',
        observaciones: presupuesto.observaciones || '',
        condicionesPago: presupuesto.condicionesPago || '',
        tiempoEntrega: presupuesto.tiempoEntrega || '',
        validezDias: presupuesto.validezDias || 30,
        descuento: Number(presupuesto.descuento) || 0,
        impuestos: Number(presupuesto.impuestos) || 21,
        moneda: presupuesto.moneda || 'PESOS',
        items: presupuesto.items?.map((item: any) => ({
          descripcion: item.descripcion,
          detalle: item.detalle || '',
          cantidad: Number(item.cantidad),
          unidad: item.unidad,
          precioUnitario: Number(item.precioUnitario),
          descuento: Number(item.descuento) || 0
        })) || [{
          descripcion: '',
          detalle: '',
          cantidad: 1,
          unidad: 'unidad',
          precioUnitario: 0,
          descuento: 0
        }]
      });
    }
    setErrors({});
  }, [presupuesto, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Calcular fecha de validez
      const fechaValidez = new Date();
      fechaValidez.setDate(fechaValidez.getDate() + formData.validezDias);
      
      const validatedData = presupuestoSchema.parse({
        ...formData,
        fechaValidez
      });
      await onSubmit(validatedData);
      onClose();
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
        setErrors({ general: error.message || 'Error al guardar presupuesto' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
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
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof ItemPresupuestoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={presupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
      size="xl"
    >
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
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Cliente *"
              value={formData.clienteId}
              onChange={(e) => setFormData(prev => ({ ...prev, clienteId: e.target.value }))}
              error={errors.clienteId}
            >
              <option value="">Seleccionar cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </Select>

            <Input
              label="Validez (días)"
              type="number"
              value={formData.validezDias}
              onChange={(e) => setFormData(prev => ({ ...prev, validezDias: Number(e.target.value) }))}
              error={errors.validezDias}
              min="1"
              max="365"
            />

            <div className="md:col-span-2">
              <Input
                label="Descripción de la Obra *"
                value={formData.descripcionObra}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcionObra: e.target.value }))}
                error={errors.descripcionObra}
                placeholder="Describe el trabajo a realizar..."
              />
            </div>

            <Input
              label="Tiempo de Entrega"
              value={formData.tiempoEntrega}
              onChange={(e) => setFormData(prev => ({ ...prev, tiempoEntrega: e.target.value }))}
              placeholder="ej: 15 días hábiles"
            />

            <Select
              label="Moneda"
              value={formData.moneda}
              onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value as 'PESOS' | 'DOLARES' }))}
            >
              <option value="PESOS">Pesos Argentinos</option>
              <option value="DOLARES">Dólares</option>
            </Select>
          </div>
        </div>

        {/* Items del presupuesto */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Items del Presupuesto</h3>
            <Button type="button" variant="outline" onClick={addItem}>
              <HiOutlinePlus className="h-4 w-4 mr-2" />
              Agregar Item
            </Button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Item #{index + 1}</h4>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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

                <div className="mt-3">
                  <Input
                    label="Detalle"
                    value={item.detalle}
                    onChange={(e) => updateItem(index, 'detalle', e.target.value)}
                    placeholder="Información adicional del item"
                  
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
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
          </div>
        </div>

        {/* Totales y configuración final */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Totales y Configuración</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Descuento General (%)"
                type="number"
                value={formData.descuento}
                onChange={(e) => setFormData(prev => ({ ...prev, descuento: Number(e.target.value) }))}
                min="0"
                max="100"
              />

              <Input
                label="Impuestos (%)"
                type="number"
                value={formData.impuestos}
                onChange={(e) => setFormData(prev => ({ ...prev, impuestos: Number(e.target.value) }))}
                min="0"
                max="100"
              />

              <Input
                label="Condiciones de Pago"
                value={formData.condicionesPago}
                onChange={(e) => setFormData(prev => ({ ...prev, condicionesPago: e.target.value }))}
                placeholder="ej: 50% anticipo, 50% contra entrega"
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Resumen de Totales</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{CurrencyUtils.formatAmount(totales.subtotal, formData.moneda)}</span>
                </div>
                {formData.descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({formData.descuento}%):</span>
                    <span>-{CurrencyUtils.formatAmount(totales.descuentoTotal, formData.moneda)}</span>
                  </div>
                )}
                {formData.impuestos > 0 && (
                  <div className="flex justify-between">
                    <span>Impuestos ({formData.impuestos}%):</span>
                    <span>{CurrencyUtils.formatAmount(totales.impuestos, formData.moneda)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{CurrencyUtils.formatAmount(totales.total, formData.moneda)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {presupuesto ? 'Actualizar' : 'Crear'} Presupuesto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function PresupuestosPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { presupuestos, loading, error, createPresupuesto, updatePresupuesto, convertirAVenta, refetch } = usePresupuestos({
    search: search.length >= 2 ? search : undefined,
    estado: estadoFilter || undefined
  });

  const handleCreatePresupuesto = async (data: PresupuestoFormData) => {
    await createPresupuesto(data);
    refetch();
  };

  const handleUpdatePresupuesto = async (data: PresupuestoFormData) => {
    if (selectedPresupuesto) {
      await updatePresupuesto(selectedPresupuesto.id, data);
      refetch();
    }
  };

  const handleConvertToSale = async (presupuesto: any) => {
    if (confirm(`¿Convertir el presupuesto "${presupuesto.numero}" a venta/pedido?`)) {
      await convertirAVenta(presupuesto.id);
      refetch();
    }
  };

  const openEditModal = (presupuesto: any) => {
    setSelectedPresupuesto(presupuesto);
    setIsFormModalOpen(true);
  };

  const openDetailModal = (presupuesto: any) => {
    setSelectedPresupuesto(presupuesto);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedPresupuesto(null);
  };

  // Estadísticas
  const stats = {
    total: presupuestos.length,
    pendientes: presupuestos.filter(p => ['PENDIENTE', 'ENVIADO'].includes(p.estado)).length,
    aprobados: presupuestos.filter(p => p.estado === 'APROBADO').length,
    vencidos: presupuestos.filter(p => p.estado === 'VENCIDO').length,
    montoTotal: presupuestos.reduce((acc, p) => acc + Number(p.total), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-600">Gestiona los presupuestos de tus proyectos</p>
        </div>
        <Button onClick={() => setIsFormModalOpen(true)}>
          <HiOutlinePlus className="h-4 w-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineDocumentText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aprobados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineExclamationCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vencidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.vencidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monto Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(stats.montoTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por número, cliente o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_PRESUPUESTO).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </Select>
            <Button variant="outline" onClick={refetch}>
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar presupuestos</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : presupuestos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineDocumentText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay presupuestos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || estadoFilter ? 'No se encontraron presupuestos con esos criterios' : 'Comienza creando tu primer presupuesto'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Presupuesto</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Validez</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuestos.map((presupuesto) => {
                  const estadoInfo = ESTADOS_PRESUPUESTO[presupuesto.estado as keyof typeof ESTADOS_PRESUPUESTO];
                  const dueStatus = DateUtils.getDueStatus(presupuesto.fechaValidez);
                  
                  return (
                    <TableRow key={presupuesto.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{presupuesto.numero}</div>
                          <div className="text-sm text-gray-500">
                            {DateUtils.formatDate(presupuesto.fechaEmision)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{presupuesto.cliente.nombre}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {presupuesto.descripcionObra}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {CurrencyUtils.formatAmount(presupuesto.total, presupuesto.moneda as Currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                          estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                          estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {estadoInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-gray-900">
                            {DateUtils.formatDate(presupuesto.fechaValidez)}
                          </div>
                          <div className={`text-xs ${dueStatus.color}`}>
                            {dueStatus.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailModal(presupuesto)}
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </Button>
                          {presupuesto.estado !== 'CONVERTIDO' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(presupuesto)}
                            >
                              <HiOutlinePencil className="h-4 w-4" />
                            </Button>
                          )}
                          {presupuesto.estado === 'APROBADO' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConvertToSale(presupuesto)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <HiOutlineClipboardCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <PresupuestoForm
        isOpen={isFormModalOpen}
        onClose={closeModals}
        presupuesto={selectedPresupuesto}
        onSubmit={selectedPresupuesto ? handleUpdatePresupuesto : handleCreatePresupuesto}
      />

      {/* Modal de detalle - simplificado para no hacer muy largo el código */}
      {selectedPresupuesto && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle: ${selectedPresupuesto.numero}`}
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPresupuesto.cliente.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total</label>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(selectedPresupuesto.total, selectedPresupuesto.moneda)}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
              {selectedPresupuesto.estado === 'APROBADO' && (
                <Button onClick={() => handleConvertToSale(selectedPresupuesto)}>
                  Convertir a Venta
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}