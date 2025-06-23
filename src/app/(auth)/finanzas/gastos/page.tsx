// src/app/(auth)/finanzas/gastos/page.tsx
'use client';

import { useState } from 'react';
import { useGastosGenerales } from '@/hooks/use-gastos-generales';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineChartPie,
  HiOutlineTrendingUp,
  HiOutlineClipboardList
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import React from 'react';

interface GastoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  gasto?: any;
}

function GastoForm({ isOpen, onClose, onSubmit, gasto }: GastoFormProps) {
  const [formData, setFormData] = useState({
    descripcion: '',
    categoria: '',
    subcategoria: '',
    monto: 0,
    moneda: 'PESOS' as const,
    fecha: new Date().toISOString().split('T')[0],
    periodo: '',
    numeroFactura: '',
    proveedor: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categorías predefinidas
  const categorias = [
    'Alquiler',
    'Servicios',
    'Sueldos',
    'Impuestos',
    'Seguros',
    'Mantenimiento',
    'Combustible',
    'Viáticos',
    'Publicidad',
    'Equipamiento',
    'Otros'
  ];

  const subcategoriasPorCategoria: Record<string, string[]> = {
    'Servicios': ['Luz', 'Gas', 'Internet', 'Teléfono', 'Agua', 'Seguridad'],
    'Impuestos': ['IVA', 'Ganancias', 'IIBB', 'Municipales', 'Autónomos'],
    'Seguros': ['Responsabilidad Civil', 'Incendio', 'Robo', 'Automotor'],
    'Mantenimiento': ['Edificio', 'Maquinaria', 'Vehículos', 'Equipos'],
    'Equipamiento': ['Herramientas', 'Muebles', 'Tecnología', 'Uniformes']
  };

 
  React.useEffect(() => {
    if (gasto) {
      setFormData({
        descripcion: gasto.descripcion || '',
        categoria: gasto.categoria || '',
        subcategoria: gasto.subcategoria || '',
        monto: gasto.monto || 0,
        moneda: gasto.moneda || 'PESOS',
        fecha: gasto.fecha ? new Date(gasto.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        periodo: gasto.periodo || '',
        numeroFactura: gasto.numeroFactura || '',
        proveedor: gasto.proveedor || ''
      });
    } else {
      // Generar período automático (YYYY-MM)
      const fecha = new Date();
      const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, periodo }));
    }
  }, [gasto, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        descripcion: '',
        categoria: '',
        subcategoria: '',
        monto: 0,
        moneda: 'PESOS',
        fecha: new Date().toISOString().split('T')[0],
        periodo: '',
        numeroFactura: '',
        proveedor: ''
      });
    } catch (error: any) {
      setErrors({ general: error.message || 'Error al guardar gasto' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar período automáticamente cuando cambia la fecha
  const handleFechaChange = (fecha: string) => {
    setFormData(prev => {
      const fechaObj = new Date(fecha);
      const periodo = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}`;
      return { ...prev, fecha, periodo };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={gasto ? 'Editar Gasto' : 'Nuevo Gasto General'}
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
          <div className="md:col-span-2">
            <Input
              label="Descripción *"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción del gasto"
              required
            />
          </div>

          <Select
            label="Categoría *"
            value={formData.categoria}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              categoria: e.target.value,
              subcategoria: '' // Reset subcategoría cuando cambia categoría
            }))}
            required
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>

          <Select
            label="Subcategoría"
            value={formData.subcategoria}
            onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
            disabled={!formData.categoria || !subcategoriasPorCategoria[formData.categoria]}
          >
            <option value="">Seleccionar subcategoría</option>
            {formData.categoria && subcategoriasPorCategoria[formData.categoria]?.map(subcat => (
              <option key={subcat} value={subcat}>{subcat}</option>
            ))}
          </Select>

          <Input
            label="Monto *"
            type="number"
            value={formData.monto}
            onChange={(e) => setFormData(prev => ({ ...prev, monto: Number(e.target.value) }))}
            min="0.01"
            step="0.01"
            required
          />

          <Select
            label="Moneda"
            value={formData.moneda}
            onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value as any }))}
          >
            <option value="PESOS">Pesos Argentinos</option>
            <option value="DOLARES">Dólares</option>
          </Select>

          <Input
            label="Fecha *"
            type="date"
            value={formData.fecha}
            onChange={(e) => handleFechaChange(e.target.value)}
            required
          />

          <Input
            label="Período"
            value={formData.periodo}
            onChange={(e) => setFormData(prev => ({ ...prev, periodo: e.target.value }))}
            placeholder="YYYY-MM"
            helperText="Se genera automáticamente según la fecha"
          />

          <Input
            label="Número de Factura"
            value={formData.numeroFactura}
            onChange={(e) => setFormData(prev => ({ ...prev, numeroFactura: e.target.value }))}
            placeholder="N° de factura o comprobante"
          />

          <Input
            label="Proveedor"
            value={formData.proveedor}
            onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
            placeholder="Nombre del proveedor"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {gasto ? 'Actualizar' : 'Registrar'} Gasto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function GastosGeneralesPage() {
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { gastos, loading, error, createGasto, updateGasto, deleteGasto, refetch } = useGastosGenerales({
    categoria: categoriaFilter || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    periodo: periodoFilter || undefined
  });

  const handleCreateGasto = async (data: any) => {
    await createGasto(data);
    refetch();
  };

  const handleUpdateGasto = async (data: any) => {
    if (selectedGasto) {
      await updateGasto(selectedGasto.id, data);
      refetch();
    }
  };

  const handleDeleteGasto = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      await deleteGasto(id);
      refetch();
    }
  };

  const openEditModal = (gasto: any) => {
    setSelectedGasto(gasto);
    setIsGastoModalOpen(true);
  };

  const openDetailModal = (gasto: any) => {
    setSelectedGasto(gasto);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsGastoModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedGasto(null);
  };

  // Calcular estadísticas
  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  const gastosPorCategoria = gastos.reduce((acc, gasto) => {
    const categoria = gasto.categoria;
    acc[categoria] = (acc[categoria] || 0) + Number(gasto.monto);
    return acc;
  }, {} as Record<string, number>);

  const gastosMesActual = gastos.filter(g => {
    const fechaGasto = new Date(g.fecha);
    const hoy = new Date();
    return fechaGasto.getMonth() === hoy.getMonth() && 
           fechaGasto.getFullYear() === hoy.getFullYear();
  }).reduce((acc, g) => acc + Number(g.monto), 0);

  // Datos para gráficos
  const dataPieChart = Object.entries(gastosPorCategoria).map(([categoria, monto]) => ({
    name: categoria,
    value: monto,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  // Gastos por mes (últimos 6 meses)
  const gastosUltimos6Meses = [];
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - i);
    const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const gastosDelMes = gastos.filter(g => g.periodo === periodo);
    const totalMes = gastosDelMes.reduce((acc, g) => acc + Number(g.monto), 0);
    
    gastosUltimos6Meses.push({
      mes: fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
      total: totalMes
    });
  }

  const filteredGastos = gastos.filter(gasto => {
    const matchesSearch = gasto.descripcion.toLowerCase().includes(search.toLowerCase()) ||
                         gasto.categoria.toLowerCase().includes(search.toLowerCase()) ||
                         gasto.proveedor?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Generales</h1>
          <p className="text-gray-600">Control de gastos operativos y administrativos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsGastoModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Gastos</p>
                <p className="text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(totalGastos)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCalendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Este Mes</p>
                <p className="text-lg font-bold text-orange-600">
                  {CurrencyUtils.formatAmount(gastosMesActual)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineChartPie className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Categorías</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(gastosPorCategoria).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Registros</p>
                <p className="text-2xl font-bold text-gray-900">{gastos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPieChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dataPieChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => CurrencyUtils.formatAmount(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolución mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gastosUltimos6Meses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => CurrencyUtils.formatAmount(Number(value))}
                  />
                  <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar gastos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {Object.keys(gastosPorCategoria).map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
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

            <Input
              label="Período"
              type="month"
              value={periodoFilter}
              onChange={(e) => setPeriodoFilter(e.target.value)}
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

      {/* Tabla de gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredGastos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay gastos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || categoriaFilter ? 'No se encontraron gastos con esos criterios' : 'Comienza registrando tu primer gasto'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Descripción</TableHeaderCell>
                  <TableHeaderCell>Categoría</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                  <TableHeaderCell>Proveedor</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {DateUtils.formatDate(gasto.fecha)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {gasto.numero}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{gasto.descripcion}</div>
                        {gasto.numeroFactura && (
                          <div className="text-sm text-gray-500">Fact: {gasto.numeroFactura}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {gasto.categoria}
                        </span>
                        {gasto.subcategoria && (
                          <div className="text-xs text-gray-500 mt-1">{gasto.subcategoria}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-red-600">
                        {CurrencyUtils.formatAmount(gasto.monto, gasto.moneda as Currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {gasto.proveedor || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailModal(gasto)}
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(gasto)}
                        >
                          <HiOutlinePencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGasto(gasto.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </Button>
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
      <GastoForm
        isOpen={isGastoModalOpen}
        onClose={closeModals}
        onSubmit={selectedGasto ? handleUpdateGasto : handleCreateGasto}
        gasto={selectedGasto}
      />

      {/* Modal de detalle */}
      {selectedGasto && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle: ${selectedGasto.numero}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <p className="mt-1 text-sm text-gray-900">{selectedGasto.descripcion}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto</label>
                <p className="mt-1 text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(selectedGasto.monto, selectedGasto.moneda)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <p className="mt-1 text-sm text-gray-900">{selectedGasto.categoria}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subcategoría</label>
                <p className="mt-1 text-sm text-gray-900">{selectedGasto.subcategoria || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <p className="mt-1 text-sm text-gray-900">
                  {DateUtils.formatDate(selectedGasto.fecha)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Período</label>
                <p className="mt-1 text-sm text-gray-900">{selectedGasto.periodo || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                <p className="mt-1 text-sm text-gray-900">{selectedGasto.proveedor || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">N° Factura</label>
                <p className="mt-1 text-sm text-gray-900">{selectedGasto.numeroFactura || '-'}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
              <Button onClick={() => {
                closeModals();
                openEditModal(selectedGasto);
              }}>
                Editar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}