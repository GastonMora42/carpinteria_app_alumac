// src/app/(auth)/materiales/compras/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { useComprasMateriales, useEstadisticasCompras } from '@/hooks/use-compras-materiales';
import { useMaterials, useProveedores } from '@/hooks/use-materials';
import { useMediosPago } from '@/hooks/use-medios-pago';
import { useVentas } from '@/hooks/use-ventas';
import { CompraMaterialFormData, compraMaterialSchema, ESTADOS_PAGO } from '@/lib/validations/compra-material';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineShoppingCart,
  HiOutlineTruck,
  HiOutlineFilter
} from 'react-icons/hi';

interface CompraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  compra?: any;
  onSubmit: (data: CompraMaterialFormData) => Promise<void>;
}

function CompraFormModal({ isOpen, onClose, compra, onSubmit }: CompraFormModalProps) {
  const [formData, setFormData] = useState<CompraMaterialFormData>({
    materialId: '',
    proveedorId: '',
    cantidad: 0,
    precioUnitario: 0,
    impuestos: 21,
    moneda: 'PESOS',
    numeroFactura: '',
    cuitProveedor: '',
    fechaCompra: new Date(),
    medioPagoId: '',
    estadoPago: 'PENDIENTE'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks para datos
  const { materials } = useMaterials();
  const { proveedores } = useProveedores();
  const { mediosPago } = useMediosPago();
  const { ventas } = useVentas({ limit: 100 });

  useEffect(() => {
    if (compra) {
      setFormData({
        materialId: compra.material.id,
        proveedorId: compra.proveedor.id,
        cantidad: compra.cantidad,
        precioUnitario: compra.precioUnitario,
        impuestos: (compra.impuestos / compra.subtotal) * 100,
        moneda: compra.moneda,
        numeroFactura: compra.numeroFactura,
        cuitProveedor: compra.cuitProveedor,
        fechaCompra: new Date(compra.fechaCompra),
        fechaPago: compra.fechaPago ? new Date(compra.fechaPago) : undefined,
        fechaVencimiento: compra.fechaVencimiento ? new Date(compra.fechaVencimiento) : undefined,
        medioPagoId: compra.medioPago.id,
        estadoPago: compra.estadoPago,
        ventaId: compra.venta?.id,
        observaciones: compra.observaciones
      });
    } else {
      setFormData({
        materialId: '',
        proveedorId: '',
        cantidad: 0,
        precioUnitario: 0,
        impuestos: 21,
        moneda: 'PESOS',
        numeroFactura: '',
        cuitProveedor: '',
        fechaCompra: new Date(),
        medioPagoId: '',
        estadoPago: 'PENDIENTE'
      });
    }
    setErrors({});
  }, [compra, isOpen]);

  // Sincronizar CUIT cuando cambie el proveedor
  useEffect(() => {
    if (formData.proveedorId) {
      const proveedor = proveedores.find(p => p.id === formData.proveedorId);
      if (proveedor?.cuit) {
        setFormData(prev => ({ ...prev, cuitProveedor: proveedor.cuit || '' }));
      }
    }
  }, [formData.proveedorId, proveedores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = compraMaterialSchema.parse(formData);
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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularTotales = () => {
    const subtotal = formData.cantidad * formData.precioUnitario;
    const impuestos = (subtotal * formData.impuestos) / 100;
    const total = subtotal + impuestos;
    
    return { subtotal, impuestos, total };
  };

  const { subtotal, impuestos: montoImpuestos, total } = calcularTotales();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={compra ? 'Editar Compra' : 'Nueva Compra de Material'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de material y proveedor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Material y Proveedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Material *"
                value={formData.materialId}
                onChange={(e) => setFormData(prev => ({ ...prev, materialId: e.target.value }))}
                error={errors.materialId}
              >
                <option value="">Seleccionar material</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.codigo} - {material.nombre}
                  </option>
                ))}
              </Select>

              <Select
                label="Proveedor *"
                value={formData.proveedorId}
                onChange={(e) => setFormData(prev => ({ ...prev, proveedorId: e.target.value }))}
                error={errors.proveedorId}
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map(proveedor => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Datos de la factura */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de la Factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Factura *"
                value={formData.numeroFactura}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroFactura: e.target.value }))}
                error={errors.numeroFactura}
                placeholder="0001-00001234"
              />

              <Input
                label="CUIT del Proveedor *"
                value={formData.cuitProveedor}
                onChange={(e) => setFormData(prev => ({ ...prev, cuitProveedor: e.target.value }))}
                error={errors.cuitProveedor}
                placeholder="30-12345678-9"
              />

              <Input
                label="Fecha de Compra *"
                type="date"
                value={formData.fechaCompra instanceof Date ? 
                  formData.fechaCompra.toISOString().split('T')[0] : 
                  formData.fechaCompra
                }
                onChange={(e) => setFormData(prev => ({ ...prev, fechaCompra: new Date(e.target.value) }))}
                error={errors.fechaCompra}
              />

              <Input
                label="Fecha de Vencimiento"
                type="date"
                value={formData.fechaVencimiento instanceof Date ? 
                  formData.fechaVencimiento.toISOString().split('T')[0] : 
                  formData.fechaVencimiento || ''
                }
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fechaVencimiento: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cantidades y precios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cantidades y Precios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Cantidad *"
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: Number(e.target.value) }))}
                error={errors.cantidad}
                min="0.001"
                step="0.001"
              />

              <Input
                label="Precio Unitario *"
                type="number"
                value={formData.precioUnitario}
                onChange={(e) => setFormData(prev => ({ ...prev, precioUnitario: Number(e.target.value) }))}
                error={errors.precioUnitario}
                min="0"
                step="0.01"
              />

              <Input
                label="% Impuestos"
                type="number"
                value={formData.impuestos}
                onChange={(e) => setFormData(prev => ({ ...prev, impuestos: Number(e.target.value) }))}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* Resumen de totales */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Resumen de la Compra</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Subtotal:</span>
                  <p className="font-semibold">${subtotal.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Impuestos:</span>
                  <p className="font-semibold">${montoImpuestos.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <p className="font-bold text-lg text-blue-600">${total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pago y estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pago y Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Medio de Pago *"
                value={formData.medioPagoId}
                onChange={(e) => setFormData(prev => ({ ...prev, medioPagoId: e.target.value }))}
                error={errors.medioPagoId}
              >
                <option value="">Seleccionar medio de pago</option>
                {mediosPago.map(medio => (
                  <option key={medio.id} value={medio.id}>{medio.nombre}</option>
                ))}
              </Select>

              <Select
                label="Estado del Pago"
                value={formData.estadoPago}
                onChange={(e) => setFormData(prev => ({ ...prev, estadoPago: e.target.value as any }))}
              >
                {Object.entries(ESTADOS_PAGO).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Select>

              {formData.estadoPago === 'PAGADO' && (
                <Input
                  label="Fecha de Pago"
                  type="date"
                  value={formData.fechaPago instanceof Date ? 
                    formData.fechaPago.toISOString().split('T')[0] : 
                    formData.fechaPago || ''
                  }
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fechaPago: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                />
              )}

              <Select
                label="Vincular a Obra (Opcional)"
                value={formData.ventaId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ventaId: e.target.value || undefined }))}
              >
                <option value="">No vincular a obra específica</option>
                {ventas.map(venta => (
                  <option key={venta.id} value={venta.id}>
                    {venta.numero} - {venta.cliente.nombre}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observaciones adicionales sobre la compra..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {compra ? 'Actualizar Compra' : 'Registrar Compra'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ComprasMaterialesPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [proveedorFilter, setProveedorFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedCompra, setSelectedCompra] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Hooks para datos
  const { 
    compras, 
    loading, 
    error, 
    refetch, 
    createCompra, 
    updateEstadoPago, 
    generateReciboPDF,
    deleteCompra 
  } = useComprasMateriales({
    estadoPago: estadoFilter || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    limit: 50
  });

  const { proveedores } = useProveedores();
  const estadisticas = useEstadisticasCompras();

  const handleCreateCompra = async (compraData: CompraMaterialFormData) => {
    await createCompra(compraData);
    refetch();
  };

  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    const fechaPago = nuevoEstado === 'PAGADO' ? new Date() : undefined;
    await updateEstadoPago(id, nuevoEstado, fechaPago);
  };

  const handleGeneratePDF = async (compra: any) => {
    try {
      await generateReciboPDF(compra.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Filtrar compras por búsqueda
  const comprasFiltradas = compras.filter(compra => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      compra.numero.toLowerCase().includes(searchLower) ||
      compra.material.nombre.toLowerCase().includes(searchLower) ||
      compra.proveedor.nombre.toLowerCase().includes(searchLower) ||
      compra.numeroFactura.toLowerCase().includes(searchLower)
    );
  });

  const openDetailModal = (compra: any) => {
    setSelectedCompra(compra);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (compra: any) => {
    setSelectedCompra(compra);
    setIsFormModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedCompra(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras de Materiales</h1>
          <p className="text-gray-600">Gestión de compras, facturas y pagos a proveedores</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={refetch}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsFormModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nueva Compra
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Compras</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.loading ? '...' : estadisticas.totalCompras}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCurrencyDollar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monto Total</p>
                <p className="text-lg font-bold text-green-600">
                  {estadisticas.loading ? '...' : CurrencyUtils.formatAmount(estadisticas.montoTotalCompras)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {estadisticas.loading ? '...' : estadisticas.comprasPendientesPago}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineExclamationCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pagos Vencidos</p>
                <p className="text-2xl font-bold text-red-600">
                  {estadisticas.loading ? '...' : estadisticas.pagosVencidos}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar compras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_PAGO).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </Select>

            <Select
              value={proveedorFilter}
              onChange={(e) => setProveedorFilter(e.target.value)}
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map(proveedor => (
                <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
              ))}
            </Select>

            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              placeholder="Fecha desde"
            />

            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              placeholder="Fecha hasta"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de compras */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Compras</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar compras</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : comprasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay compras registradas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || estadoFilter || proveedorFilter
                  ? 'No se encontraron compras con esos criterios'
                  : 'Comienza registrando tu primera compra de material'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Compra</TableHeaderCell>
                  <TableHeaderCell>Material</TableHeaderCell>
                  <TableHeaderCell>Proveedor</TableHeaderCell>
                  <TableHeaderCell>Cantidad</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comprasFiltradas.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{compra.numero}</div>
                        <div className="text-sm text-gray-500">Factura: {compra.numeroFactura}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{compra.material.nombre}</div>
                        <div className="text-sm text-gray-500">{compra.material.codigo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{compra.proveedor.nombre}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{compra.cantidad}</span>
                        <span className="text-sm text-gray-500 ml-1">{compra.material.unidadMedida}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {CurrencyUtils.formatAmount(compra.total, compra.moneda as any)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          compra.estadoPago === 'PAGADO' ? 'success' :
                          compra.estadoPago === 'VENCIDO' ? 'destructive' :
                          'warning'
                        }
                      >
                        {ESTADOS_PAGO[compra.estadoPago as keyof typeof ESTADOS_PAGO]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {DateUtils.formatDate(compra.fechaCompra)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Tooltip content="Ver detalles">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailModal(compra)}
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Editar compra">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(compra)}
                          >
                            <HiOutlinePencil className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Generar recibo PDF">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGeneratePDF(compra)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <HiOutlineDocumentText className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CompraFormModal
        isOpen={isFormModalOpen}
        onClose={closeModals}
        compra={selectedCompra}
        onSubmit={handleCreateCompra}
      />

      {/* Modal de detalle */}
      {selectedCompra && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle de Compra: ${selectedCompra.numero}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Material Comprado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Código:</span> {selectedCompra.material.codigo}</p>
                  <p><span className="font-medium">Nombre:</span> {selectedCompra.material.nombre}</p>
                  <p><span className="font-medium">Cantidad:</span> {selectedCompra.cantidad} {selectedCompra.material.unidadMedida}</p>
                  <p><span className="font-medium">Precio unitario:</span> {CurrencyUtils.formatAmount(selectedCompra.precioUnitario)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Proveedor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-medium">Nombre:</span> {selectedCompra.proveedor.nombre}</p>
                  <p><span className="font-medium">CUIT:</span> {selectedCompra.cuitProveedor}</p>
                  {selectedCompra.proveedor.email && (
                    <p><span className="font-medium">Email:</span> {selectedCompra.proveedor.email}</p>
                  )}
                  {selectedCompra.proveedor.telefono && (
                    <p><span className="font-medium">Teléfono:</span> {selectedCompra.proveedor.telefono}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Totales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <p className="font-semibold">{CurrencyUtils.formatAmount(selectedCompra.subtotal)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Impuestos:</span>
                    <p className="font-semibold">{CurrencyUtils.formatAmount(selectedCompra.impuestos)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total:</span>
                    <p className="font-bold text-lg text-blue-600">{CurrencyUtils.formatAmount(selectedCompra.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado y acciones */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div>
                <span className="text-sm text-gray-600">Estado actual:</span>
                <Badge 
                  variant={
                    selectedCompra.estadoPago === 'PAGADO' ? 'success' :
                    selectedCompra.estadoPago === 'VENCIDO' ? 'destructive' :
                    'warning'
                  }
                  className="ml-2"
                >
                  {ESTADOS_PAGO[selectedCompra.estadoPago as keyof typeof ESTADOS_PAGO]?.label}
                </Badge>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={closeModals}>
                  Cerrar
                </Button>
                <Button onClick={() => handleGeneratePDF(selectedCompra)}>
                  <HiOutlineDocumentText className="h-4 w-4 mr-2" />
                  Generar PDF
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}