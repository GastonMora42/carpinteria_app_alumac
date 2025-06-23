// src/app/(auth)/reportes/rendimiento/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { api } from '@/lib/utils/http';
import { CurrencyUtils, DateUtils, CalculationUtils } from '@/lib/utils/calculations';
import { ExportUtils } from '@/lib/utils/exports';
import {
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineFilter,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCash,
  HiOutlineChartBar
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
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RendimientoObra {
  id: string;
  numero: string;
  cliente: {
    nombre: string;
  };
  descripcionObra: string;
  fechaInicio: string;
  fechaEntrega?: string;
  fechaEntregaReal?: string;
  estado: string;
  
  // Datos financieros
  totalPresupuestado: number;
  totalMateriales: number;
  totalGastos: number;
  totalCobrado: number;
  saldoPendiente: number;
  
  // Métricas calculadas
  margenBruto: number;
  margenPorcentaje: number;
  desviacionPpto: number;
  desviacionTiempo: number;
  rentabilidad: number;
  eficiencia: number;
  
  moneda: string;
}

interface AnalisisRendimiento {
  obras: RendimientoObra[];
  resumen: {
    totalObras: number;
    promedioMargen: number;
    totalFacturado: number;
    totalCostos: number;
    gananciaNeta: number;
    obrasRentables: number;
    obrasPerdida: number;
    promedioDiasDesvio: number;
  };
  chartData: {
    margenPorObra: any[];
    rentabilidadVsTiempo: any[];
    distribucionMargenes: any[];
  };
}

export default function RendimientoPorObraPage() {
  const [analisis, setAnalisis] = useState<AnalisisRendimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    fechaDesde: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    estado: '',
    clienteId: '',
    search: ''
  });
  
  const [clients, setClients] = useState<any[]>([]);
  const [selectedObra, setSelectedObra] = useState<RendimientoObra | null>(null);

  const fetchAnalisisRendimiento = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });

      const data = await api.get(`/api/reportes/rendimiento?${searchParams}`);
      setAnalisis(data);
    } catch (err: any) {
      console.error('Error fetching análisis:', err);
      setError(err.message || 'Error al cargar análisis de rendimiento');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await api.get('/api/clientes');
      setClients(data.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const exportAnalisis = async () => {
    if (!analisis) return;

    try {
      const exportData = analisis.obras.map(obra => ({
        'Número': obra.numero,
        'Cliente': obra.cliente.nombre,
        'Descripción': obra.descripcionObra,
        'Estado': obra.estado,
        'Presupuestado': obra.totalPresupuestado,
        'Materiales': obra.totalMateriales,
        'Gastos': obra.totalGastos,
        'Cobrado': obra.totalCobrado,
        'Margen Bruto': obra.margenBruto,
        'Margen %': obra.margenPorcentaje,
        'Rentabilidad': obra.rentabilidad,
        'Desviación Ppto %': obra.desviacionPpto,
        'Desviación Tiempo (días)': obra.desviacionTiempo,
        'Fecha Inicio': DateUtils.formatDate(obra.fechaInicio),
        'Fecha Entrega': obra.fechaEntrega ? DateUtils.formatDate(obra.fechaEntrega) : '',
        'Fecha Real': obra.fechaEntregaReal ? DateUtils.formatDate(obra.fechaEntregaReal) : ''
      }));

      await ExportUtils.exportToExcel(
        exportData,
        [
          { key: 'Número', label: 'Número', width: 15 },
          { key: 'Cliente', label: 'Cliente', width: 25 },
          { key: 'Descripción', label: 'Descripción', width: 30 },
          { key: 'Estado', label: 'Estado', width: 15 },
          { key: 'Presupuestado', label: 'Presupuestado', format: 'currency', width: 15 },
          { key: 'Materiales', label: 'Materiales', format: 'currency', width: 15 },
          { key: 'Gastos', label: 'Gastos', format: 'currency', width: 15 },
          { key: 'Cobrado', label: 'Cobrado', format: 'currency', width: 15 },
          { key: 'Margen Bruto', label: 'Margen Bruto', format: 'currency', width: 15 },
          { key: 'Margen %', label: 'Margen %', format: 'number', width: 12 },
          { key: 'Rentabilidad', label: 'Rentabilidad', format: 'number', width: 12 },
          { key: 'Desviación Ppto %', label: 'Desv. Ppto %', format: 'number', width: 15 },
          { key: 'Desviación Tiempo (días)', label: 'Desv. Tiempo', format: 'number', width: 18 },
          { key: 'Fecha Inicio', label: 'Fecha Inicio', format: 'date', width: 15 },
          { key: 'Fecha Entrega', label: 'F. Entrega', format: 'date', width: 15 },
          { key: 'Fecha Real', label: 'F. Real', format: 'date', width: 15 }
        ],
        `Rendimiento-por-Obra-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`,
        'Rendimiento por Obra'
      );
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  useEffect(() => {
    fetchAnalisisRendimiento();
    fetchClients();
  }, [JSON.stringify(filters)]);

  const getMargenColor = (margen: number) => {
    if (margen >= 30) return 'text-green-600';
    if (margen >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMargenBgColor = (margen: number) => {
    if (margen >= 30) return 'bg-green-100';
    if (margen >= 15) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getDesvioColor = (desvio: number) => {
    if (Math.abs(desvio) <= 5) return 'text-green-600';
    if (Math.abs(desvio) <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analizando rendimiento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar análisis</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button onClick={fetchAnalisisRendimiento} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!analisis) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendimiento por Obra</h1>
          <p className="text-gray-600">Análisis de rentabilidad y eficiencia de proyectos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportAnalisis}>
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={fetchAnalisisRendimiento}>
            <HiOutlineChartBar className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar obra..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={filters.clienteId}
              onChange={(e) => setFilters(prev => ({ ...prev, clienteId: e.target.value }))}
            >
              <option value="">Todos los clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </Select>

            <Select
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
            >
              <option value="">Todos los estados</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="FACTURADO">Facturado</option>
              <option value="COBRADO">Cobrado</option>
              <option value="EN_PROCESO">En Proceso</option>
            </Select>

            <Input
              label="Desde"
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
            />

            <Input
              label="Hasta"
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* KPIs Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineChartBar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Obras</p>
                <p className="text-2xl font-bold text-gray-900">{analisis.resumen.totalObras}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Margen Promedio</p>
                <p className={`text-2xl font-bold ${getMargenColor(analisis.resumen.promedioMargen)}`}>
                  {analisis.resumen.promedioMargen.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ganancia Neta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(analisis.resumen.gananciaNeta)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClock className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Desvío Promedio</p>
                <p className={`text-2xl font-bold ${getDesvioColor(analisis.resumen.promedioDiasDesvio)}`}>
                  {analisis.resumen.promedioDiasDesvio > 0 ? '+' : ''}{analisis.resumen.promedioDiasDesvio} días
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margen por Obra */}
        <Card>
          <CardHeader>
            <CardTitle>Margen de Ganancia por Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analisis.chartData.margenPorObra}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="numero" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Margen']}
                  />
                  <Bar 
                    dataKey="margen" 
                    fill="#3b82f6"
                    name="Margen %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rentabilidad vs Tiempo */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad vs Tiempo de Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={analisis.chartData.rentabilidadVsTiempo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dias" type="number" domain={['dataMin', 'dataMax']} />
                  <YAxis dataKey="rentabilidad" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'rentabilidad' ? `${Number(value).toFixed(1)}%` : `${value} días`,
                      name === 'rentabilidad' ? 'Rentabilidad' : 'Días'
                    ]}
                  />
                  <Scatter dataKey="rentabilidad" fill="#10b981" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Márgenes */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Márgenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analisis.chartData.distribucionMargenes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analisis.chartData.distribucionMargenes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolución Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Rentabilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analisis.chartData.margenPorObra}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="numero" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Margen']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="margen" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Obra</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Obra</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Presupuestado</TableHeaderCell>
                  <TableHeaderCell>Costos Reales</TableHeaderCell>
                  <TableHeaderCell>Margen</TableHeaderCell>
                  <TableHeaderCell>Desvío Tiempo</TableHeaderCell>
                  <TableHeaderCell>Rentabilidad</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analisis.obras.map((obra) => {
                  const costosReales = obra.totalMateriales + obra.totalGastos;
                  return (
                    <TableRow key={obra.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{obra.numero}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {obra.descripcionObra}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{obra.cliente.nombre}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {obra.estado}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {CurrencyUtils.formatAmount(obra.totalPresupuestado, obra.moneda as any)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {CurrencyUtils.formatAmount(costosReales, obra.moneda as any)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Mat: {CurrencyUtils.formatAmount(obra.totalMateriales, obra.moneda as any)} | 
                            Gas: {CurrencyUtils.formatAmount(obra.totalGastos, obra.moneda as any)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className={`font-medium ${getMargenColor(obra.margenPorcentaje)}`}>
                            {obra.margenPorcentaje.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {CurrencyUtils.formatAmount(obra.margenBruto, obra.moneda as any)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${getDesvioColor(obra.desviacionTiempo)}`}>
                          {obra.desviacionTiempo > 0 ? '+' : ''}{obra.desviacionTiempo} días
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMargenBgColor(obra.rentabilidad)}`}>
                          {obra.rentabilidad >= 0 ? (
                            <HiOutlineTrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <HiOutlineTrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {obra.rentabilidad.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedObra(obra)}
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}