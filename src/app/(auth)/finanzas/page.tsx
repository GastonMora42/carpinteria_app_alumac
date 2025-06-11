// src/app/(auth)/finanzas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTransacciones } from '@/hooks/use-transacciones';
import { useDashboard } from '@/hooks/use-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { TransaccionFormData, transaccionSchema } from '@/lib/validations/transaccion';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineCash,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineFilter
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TransaccionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
}

function TransaccionForm({ isOpen, onClose, onSubmit }: TransaccionFormProps) {
  const [formData, setFormData] = useState<TransaccionFormData>({
    tipo: 'INGRESO',
    concepto: '',
    descripcion: '',
    monto: 0,
    moneda: 'PESOS',
    fecha: new Date(),
    numeroComprobante: '',
    tipoComprobante: '',
    medioPagoId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock medios de pago
  const mediosPago = [
    { id: '1', nombre: 'Efectivo' },
    { id: '2', nombre: 'Transferencia Bancaria' },
    { id: '3', nombre: 'Cheque' },
    { id: '4', nombre: 'Tarjeta de Débito' },
    { id: '5', nombre: 'Tarjeta de Crédito' }
  ];

  const tiposTransaccion = [
    { value: 'INGRESO', label: 'Ingreso General' },
    { value: 'EGRESO', label: 'Egreso General' },
    { value: 'ANTICIPO', label: 'Anticipo de Cliente' },
    { value: 'PAGO_OBRA', label: 'Pago de Obra' },
    { value: 'PAGO_PROVEEDOR', label: 'Pago a Proveedor' },
    { value: 'GASTO_GENERAL', label: 'Gasto General' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'AJUSTE', label: 'Ajuste Contable' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = transaccionSchema.parse(formData);
      await onSubmit(validatedData);
      onClose();
      // Reset form
      setFormData({
        tipo: 'INGRESO',
        concepto: '',
        descripcion: '',
        monto: 0,
        moneda: 'PESOS',
        fecha: new Date(),
        numeroComprobante: '',
        tipoComprobante: '',
        medioPagoId: ''
      });
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
        setErrors({ general: error.message || 'Error al guardar transacción' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TransaccionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Transacción"
      size="lg"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Transacción *"
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            error={errors.tipo}
          >
            {tiposTransaccion.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </Select>

          <Input
            label="Monto *"
            type="number"
            value={formData.monto}
            onChange={(e) => handleChange('monto', Number(e.target.value))}
            error={errors.monto}
            min="0.01"
            step="0.01"
            placeholder="0.00"
          />

          <div className="md:col-span-2">
            <Input
              label="Concepto *"
              value={formData.concepto}
              onChange={(e) => handleChange('concepto', e.target.value)}
              error={errors.concepto}
              placeholder="Describe el motivo de la transacción"
            />
          </div>

          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha instanceof Date ? formData.fecha.toISOString().split('T')[0] : formData.fecha}
            onChange={(e) => handleChange('fecha', new Date(e.target.value))}
            error={errors.fecha}
          />

          <Select
            label="Moneda"
            value={formData.moneda}
            onChange={(e) => handleChange('moneda', e.target.value)}
          >
            <option value="PESOS">Pesos Argentinos</option>
            <option value="DOLARES">Dólares</option>
          </Select>

          <Select
            label="Medio de Pago *"
            value={formData.medioPagoId}
            onChange={(e) => handleChange('medioPagoId', e.target.value)}
            error={errors.medioPagoId}
          >
            <option value="">Seleccionar medio</option>
            {mediosPago.map(medio => (
              <option key={medio.id} value={medio.id}>{medio.nombre}</option>
            ))}
          </Select>

          <Input
            label="Número de Comprobante"
            value={formData.numeroComprobante}
            onChange={(e) => handleChange('numeroComprobante', e.target.value)}
            placeholder="Número de factura/recibo"
          />

          <Input
            label="Tipo de Comprobante"
            value={formData.tipoComprobante}
            onChange={(e) => handleChange('tipoComprobante', e.target.value)}
            placeholder="Factura A, Recibo, etc."
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Información adicional..."
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Registrar Transacción
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function FinanzasPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isTransaccionModalOpen, setIsTransaccionModalOpen] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: dashboardData } = useDashboard();
  const { transacciones, loading, error, createTransaccion, refetch } = useTransacciones({
    tipo: tipoFilter || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined
  });

  const handleCreateTransaccion = async (data: TransaccionFormData) => {
    await createTransaccion(data);
    refetch();
  };

  const openDetailModal = (transaccion: any) => {
    setSelectedTransaccion(transaccion);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsTransaccionModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedTransaccion(null);
  };

  // Calcular estadísticas
  const ingresos = transacciones.filter(t => ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(t.tipo));
  const egresos = transacciones.filter(t => ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo));

  const totalIngresos = ingresos.reduce((acc, t) => acc + Number(t.monto), 0);
  const totalEgresos = egresos.reduce((acc, t) => acc + Number(t.monto), 0);
  const flujoNeto = totalIngresos - totalEgresos;

  // Datos para gráficos
  const flujoMensual = [
    { mes: 'Ene', ingresos: 120000, egresos: 80000 },
    { mes: 'Feb', ingresos: 98000, egresos: 75000 },
    { mes: 'Mar', ingresos: 150000, egresos: 90000 },
    { mes: 'Abr', ingresos: 180000, egresos: 110000 },
    { mes: 'May', ingresos: 160000, egresos: 95000 },
    { mes: 'Jun', ingresos: 200000, egresos: 120000 }
  ];

  const distribucionTipos = [
    { name: 'Ingresos por Obras', value: totalIngresos * 0.7, color: '#10b981' },
    { name: 'Anticipos', value: totalIngresos * 0.2, color: '#3b82f6' },
    { name: 'Otros Ingresos', value: totalIngresos * 0.1, color: '#8b5cf6' }
  ];

  const tiposTransaccion = [
    { value: '', label: 'Todos los tipos' },
    { value: 'INGRESO', label: 'Ingresos' },
    { value: 'EGRESO', label: 'Egresos' },
    { value: 'ANTICIPO', label: 'Anticipos' },
    { value: 'PAGO_OBRA', label: 'Pagos de Obra' },
    { value: 'PAGO_PROVEEDOR', label: 'Pagos a Proveedores' },
    { value: 'GASTO_GENERAL', label: 'Gastos Generales' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-600">Control financiero y flujo de caja</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsTransaccionModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiOutlineTrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Ingresos
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {CurrencyUtils.formatAmount(totalIngresos)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiOutlineTrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Egresos
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {CurrencyUtils.formatAmount(totalEgresos)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiOutlineCash className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Flujo Neto
                  </dt>
                  <dd className={`text-lg font-medium ${flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {CurrencyUtils.formatAmount(flujoNeto)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiOutlineExclamationCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Por Cobrar
                  </dt>
                  <dd className="text-lg font-medium text-yellow-600">
                    {CurrencyUtils.formatAmount(dashboardData?.estadisticas.saldosPorCobrar || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flujo mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flujoMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      CurrencyUtils.formatAmount(Number(value)), 
                      name === 'ingresos' ? 'Ingresos' : 'Egresos'
                    ]}
                  />
                  <Bar dataKey="ingresos" fill="#10b981" name="ingresos" />
                  <Bar dataKey="egresos" fill="#ef4444" name="egresos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de ingresos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionTipos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionTipos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => CurrencyUtils.formatAmount(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
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
                placeholder="Buscar transacciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              {tiposTransaccion.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </Select>

            <Input
              label="Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />

            <Input
              label="Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />

            <div className="flex items-end">
              <Button variant="outline" onClick={refetch} className="w-full">
                <HiOutlineFilter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar transacciones</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay transacciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || tipoFilter ? 'No se encontraron transacciones con esos criterios' : 'Comienza registrando tu primera transacción'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Concepto</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                  <TableHeaderCell>Medio de Pago</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacciones.map((transaccion) => (
                  <TableRow key={transaccion.id}>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {DateUtils.formatDate(transaccion.fecha)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaccion.numero}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{transaccion.concepto}</div>
                        {transaccion.descripcion && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {transaccion.descripcion}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaccion.tipo.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? '+' : '-'}
                        {CurrencyUtils.formatAmount(transaccion.monto, transaccion.moneda as Currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {transaccion.medioPago?.nombre || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(transaccion)}
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de nueva transacción */}
      <TransaccionForm
        isOpen={isTransaccionModalOpen}
        onClose={closeModals}
        onSubmit={handleCreateTransaccion}
      />

      {/* Modal de detalle */}
      {selectedTransaccion && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Transacción: ${selectedTransaccion.numero}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTransaccion.tipo.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto</label>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(selectedTransaccion.monto, selectedTransaccion.moneda)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <p className="mt-1 text-sm text-gray-900">
                  {DateUtils.formatDateTime(selectedTransaccion.fecha)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Medio de Pago</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTransaccion.medioPago?.nombre}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Concepto</label>
              <p className="mt-1 text-sm text-gray-900">{selectedTransaccion.concepto}</p>
            </div>

            {selectedTransaccion.descripcion && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTransaccion.descripcion}</p>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}