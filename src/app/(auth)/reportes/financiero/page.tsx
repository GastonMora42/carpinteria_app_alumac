// src/app/(auth)/reportes/financiero/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/utils/http';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ExportUtils } from '@/lib/utils/exports';
import {
  HiOutlineDownload,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCash,
  HiOutlineReceiptTax,
  HiOutlineBadgeCheck,
  HiOutlineClipboardList,
  HiOutlineChartPie,
  HiOutlineCalculator
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
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

interface AnalisisFinanciero {
  periodo: {
    desde: string;
    hasta: string;
  };
  resumen: {
    ingresosTotales: number;
    egresosTotales: number;
    gananciaNeta: number;
    margenOperativo: number;
    liquidezActual: number;
    cuentasPorCobrar: number;
    cuentasPorPagar: number;
    flujoEfectivo: number;
  };
  ingresos: {
    porCategoria: Array<{ categoria: string; monto: number; porcentaje: number; color: string }>;
    porMes: Array<{ mes: string; ingresos: number; ventas: number; anticipos: number }>;
    topClientes: Array<{ cliente: string; monto: number; transacciones: number }>;
  };
  egresos: {
    porCategoria: Array<{ categoria: string; monto: number; porcentaje: number; color: string }>;
    porMes: Array<{ mes: string; egresos: number; materiales: number; gastos: number }>;
    topProveedores: Array<{ proveedor: string; monto: number; transacciones: number }>;
  };
  flujoEfectivo: {
    mensual: Array<{ 
      mes: string; 
      ingresos: number; 
      egresos: number; 
      neto: number;
      acumulado: number;
    }>;
    proyeccion: Array<{
      mes: string;
      proyectado: number;
      tendencia: string;
    }>;
  };
  rentabilidad: {
    porObra: Array<{
      obra: string;
      inversion: number;
      retorno: number;
      roi: number;
      margen: number;
    }>;
    porCliente: Array<{
      cliente: string;
      ventas: number;
      costo: number;
      margen: number;
      rentabilidad: number;
    }>;
  };
  ratiosFinancieros: {
    liquidez: number;
    rentabilidadVentas: number;
    rentabilidadActivos: number;
    rotacionInventario: number;
    diasCobranza: number;
    diasPago: number;
    endeudamiento: number;
  };
}

export default function AnalisisFinancieroPage() {
  const [analisis, setAnalisis] = useState<AnalisisFinanciero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('resumen');
  
  const [filters, setFilters] = useState({
    fechaDesde: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    moneda: 'PESOS',
    incluirProyecciones: true
  });

  const fetchAnalisisFinanciero = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });

      const data = await api.get(`/api/reportes/financiero?${searchParams}`);
      setAnalisis(data);
    } catch (err: any) {
      console.error('Error fetching análisis financiero:', err);
      setError(err.message || 'Error al cargar análisis financiero');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalisis = async () => {
    try {
      const response = await fetch(`/api/reportes/financiero/export?${new URLSearchParams(filters)}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analisis-financiero-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error al exportar:', error);
    }
  };

  useEffect(() => {
    fetchAnalisisFinanciero();
  }, [JSON.stringify(filters)]);

  const tabs = [
    { id: 'resumen', label: 'Resumen Ejecutivo', icon: HiOutlineChartPie },
    { id: 'ingresos', label: 'Análisis de Ingresos', icon: HiOutlineTrendingUp },
    { id: 'egresos', label: 'Análisis de Egresos', icon: HiOutlineTrendingDown },
    { id: 'flujo', label: 'Flujo de Efectivo', icon: HiOutlineCash },
    { id: 'rentabilidad', label: 'Rentabilidad', icon: HiOutlineBadgeCheck },
    { id: 'ratios', label: 'Ratios Financieros', icon: HiOutlineCalculator }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generando análisis financiero...</p>
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
        <Button onClick={fetchAnalisisFinanciero} className="mt-4">
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
          <h1 className="text-2xl font-bold text-gray-900">Análisis Financiero</h1>
          <p className="text-gray-600">
            Período: {DateUtils.formatDate(analisis.periodo.desde)} - {DateUtils.formatDate(analisis.periodo.hasta)}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportAnalisis}>
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
          <Button onClick={fetchAnalisisFinanciero}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Fecha Desde"
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
            />

            <Input
              label="Fecha Hasta"
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
            />

            <Select
              label="Moneda"
              value={filters.moneda}
              onChange={(e) => setFilters(prev => ({ ...prev, moneda: e.target.value }))}
            >
              <option value="PESOS">Pesos Argentinos</option>
              <option value="DOLARES">Dólares</option>
            </Select>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="proyecciones"
                checked={filters.incluirProyecciones}
                onChange={(e) => setFilters(prev => ({ ...prev, incluirProyecciones: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="proyecciones" className="text-sm font-medium text-gray-700">
                Incluir proyecciones
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {CurrencyUtils.formatAmount(analisis.resumen.ingresosTotales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Egresos Totales</p>
                <p className="text-2xl font-bold text-red-600">
                  {CurrencyUtils.formatAmount(analisis.resumen.egresosTotales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ganancia Neta</p>
                <p className={`text-2xl font-bold ${
                  analisis.resumen.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {CurrencyUtils.formatAmount(analisis.resumen.gananciaNeta)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineReceiptTax className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Margen Operativo</p>
                <p className={`text-2xl font-bold ${
                  analisis.resumen.margenOperativo >= 15 ? 'text-green-600' : 
                  analisis.resumen.margenOperativo >= 5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analisis.resumen.margenOperativo.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Navegación */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido por Tab */}
      {selectedTab === 'resumen' && (
        <div className="space-y-6">
          {/* Flujo de Efectivo General */}
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Efectivo Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analisis.flujoEfectivo.mensual}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => CurrencyUtils.formatAmount(Number(value))} />
                    <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                    <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                    <Line type="monotone" dataKey="neto" stroke="#3b82f6" strokeWidth={3} name="Flujo Neto" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribución de Ingresos y Egresos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analisis.ingresos.porCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, porcentaje }) => `${categoria} ${porcentaje.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="monto"
                      >
                        {analisis.ingresos.porCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => CurrencyUtils.formatAmount(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Egresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analisis.egresos.porCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, porcentaje }) => `${categoria} ${porcentaje.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="monto"
                      >
                        {analisis.egresos.porCategoria.map((entry, index) => (
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

          {/* Indicadores de Liquidez */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">Cuentas por Cobrar</h3>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {CurrencyUtils.formatAmount(analisis.resumen.cuentasPorCobrar)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Saldos pendientes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">Cuentas por Pagar</h3>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {CurrencyUtils.formatAmount(analisis.resumen.cuentasPorPagar)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Obligaciones pendientes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">Liquidez Actual</h3>
                  <p className={`text-2xl font-bold mt-2 ${
                    analisis.resumen.liquidezActual >= 1.5 ? 'text-green-600' :
                    analisis.resumen.liquidezActual >= 1 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {analisis.resumen.liquidezActual.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Capacidad de pago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedTab === 'ratios' && analisis.ratiosFinancieros && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Ratio de Liquidez</h3>
                <p className={`text-3xl font-bold mt-2 ${
                  analisis.ratiosFinancieros.liquidez >= 1.5 ? 'text-green-600' :
                  analisis.ratiosFinancieros.liquidez >= 1 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analisis.ratiosFinancieros.liquidez.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Activo circulante / Pasivo circulante</p>
                <div className="mt-3">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    analisis.ratiosFinancieros.liquidez >= 1.5 ? 'bg-green-100 text-green-800' :
                    analisis.ratiosFinancieros.liquidez >= 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {analisis.ratiosFinancieros.liquidez >= 1.5 ? 'Excelente' :
                     analisis.ratiosFinancieros.liquidez >= 1 ? 'Aceptable' : 'Crítico'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Rentabilidad de Ventas</h3>
                <p className={`text-3xl font-bold mt-2 ${
                  analisis.ratiosFinancieros.rentabilidadVentas >= 15 ? 'text-green-600' :
                  analisis.ratiosFinancieros.rentabilidadVentas >= 5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analisis.ratiosFinancieros.rentabilidadVentas.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Utilidad neta / Ventas netas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Días de Cobranza</h3>
                <p className={`text-3xl font-bold mt-2 ${
                  analisis.ratiosFinancieros.diasCobranza <= 30 ? 'text-green-600' :
                  analisis.ratiosFinancieros.diasCobranza <= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analisis.ratiosFinancieros.diasCobranza.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Días promedio de cobro</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Rotación de Inventario</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {analisis.ratiosFinancieros.rotacionInventario.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Veces por año</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Días de Pago</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {analisis.ratiosFinancieros.diasPago.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Días promedio de pago</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Nivel de Endeudamiento</h3>
                <p className={`text-3xl font-bold mt-2 ${
                  analisis.ratiosFinancieros.endeudamiento <= 30 ? 'text-green-600' :
                  analisis.ratiosFinancieros.endeudamiento <= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analisis.ratiosFinancieros.endeudamiento.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Pasivo total / Activo total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}