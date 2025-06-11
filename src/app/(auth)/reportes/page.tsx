// src/app/(auth)/reportes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ExportUtils } from '@/lib/utils/exports';
import {
  HiOutlineChartBar,
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineTrendingUp,
  HiOutlineCash,
  HiOutlineUsers,
  HiOutlineClipboardCheck,
  HiOutlinePrinter,
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
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface ReportData {
  ventasPorMes: any[];
  clientesTop: any[];
  rendimientoPorObra: any[];
  analisisFinanciero: any[];
  distribucionEstados: any[];
  kpis: {
    totalVentas: number;
    margenPromedio: number;
    tiempoPromedioEntrega: number;
    clientesActivos: number;
    conversionPresupuestos: number;
  };
}

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState({
    desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Mock data - en producción vendría de APIs
  const mockReportData: ReportData = {
    ventasPorMes: [
      { mes: 'Ene', ventas: 120000, presupuestos: 15, obras: 8 },
      { mes: 'Feb', ventas: 98000, presupuestos: 12, obras: 6 },
      { mes: 'Mar', ventas: 150000, presupuestos: 18, obras: 10 },
      { mes: 'Abr', ventas: 180000, presupuestos: 22, obras: 12 },
      { mes: 'May', ventas: 160000, presupuestos: 20, obras: 11 },
      { mes: 'Jun', ventas: 200000, presupuestos: 25, obras: 14 }
    ],
    clientesTop: [
      { nombre: 'Constructora ABC', ventas: 450000, obras: 5, margen: 35 },
      { nombre: 'Inmobiliaria XYZ', ventas: 320000, obras: 3, margen: 28 },
      { nombre: 'Edificios Modernos', ventas: 280000, obras: 4, margen: 32 },
      { nombre: 'Desarrollos Sur', ventas: 150000, obras: 2, margen: 40 },
      { nombre: 'Torres del Norte', ventas: 120000, obras: 2, margen: 25 }
    ],
    rendimientoPorObra: [
      { obra: 'Torre Residencial A', presupuesto: 150000, real: 145000, margen: 32, dias: 25 },
      { obra: 'Edificio Comercial B', presupuesto: 200000, real: 210000, margen: 28, dias: 35 },
      { obra: 'Casa Familia C', presupuesto: 80000, real: 75000, margen: 40, dias: 15 },
      { obra: 'Oficinas Downtown', presupuesto: 300000, real: 295000, margen: 35, dias: 45 }
    ],
    analisisFinanciero: [
      { mes: 'Ene', ingresos: 120000, costos: 78000, gastos: 25000, ganancia: 17000 },
      { mes: 'Feb', ingresos: 98000, costos: 64000, gastos: 22000, ganancia: 12000 },
      { mes: 'Mar', ingresos: 150000, costos: 95000, gastos: 28000, ganancia: 27000 },
      { mes: 'Abr', ingresos: 180000, costos: 115000, gastos: 30000, ganancia: 35000 },
      { mes: 'May', ingresos: 160000, costos: 100000, gastos: 26000, ganancia: 34000 },
      { mes: 'Jun', ingresos: 200000, costos: 125000, gastos: 32000, ganancia: 43000 }
    ],
    distribucionEstados: [
      { name: 'Entregados', value: 45, color: '#10b981' },
      { name: 'En Proceso', value: 25, color: '#3b82f6' },
      { name: 'Pendientes', value: 20, color: '#f59e0b' },
      { name: 'Cancelados', value: 10, color: '#ef4444' }
    ],
    kpis: {
      totalVentas: 1308000,
      margenPromedio: 32.5,
      tiempoPromedioEntrega: 28,
      clientesActivos: 48,
      conversionPresupuestos: 67
    }
  };

  useEffect(() => {
    // Cargar datos del reporte
    setReportData(mockReportData);
  }, [dateRange, reportType]);

  const generateReport = async () => {
    setLoading(true);
    // Simular carga
    setTimeout(() => {
      setReportData(mockReportData);
      setLoading(false);
    }, 1500);
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    try {
      // Exportar ventas por mes
      await ExportUtils.exportToExcel(
        reportData.ventasPorMes,
        [
          { key: 'mes', label: 'Mes', width: 15 },
          { key: 'ventas', label: 'Ventas', format: 'currency', width: 20 },
          { key: 'presupuestos', label: 'Presupuestos', format: 'number', width: 15 },
          { key: 'obras', label: 'Obras', format: 'number', width: 15 }
        ],
        `Reporte-Ventas-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`,
        'Ventas por Mes'
      );
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      // Crear contenido HTML para PDF
      const htmlContent = `
        <html>
          <head>
            <title>Reporte AlumGestión</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
              .kpi-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reporte Ejecutivo - AlumGestión</h1>
              <p>Período: ${DateUtils.formatDate(new Date(dateRange.desde))} - ${DateUtils.formatDate(new Date(dateRange.hasta))}</p>
              <p>Generado: ${DateUtils.formatDateTime(new Date())}</p>
            </div>
            
            <div class="kpi-grid">
              <div class="kpi-card">
                <h3>Total Ventas</h3>
                <p style="font-size: 24px; color: #10b981;">${CurrencyUtils.formatAmount(reportData!.kpis.totalVentas)}</p>
              </div>
              <div class="kpi-card">
                <h3>Margen Promedio</h3>
                <p style="font-size: 24px; color: #3b82f6;">${reportData!.kpis.margenPromedio}%</p>
              </div>
              <div class="kpi-card">
                <h3>Clientes Activos</h3>
                <p style="font-size: 24px; color: #8b5cf6;">${reportData!.kpis.clientesActivos}</p>
              </div>
            </div>

            <h2>Top Clientes</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Ventas</th>
                  <th>Obras</th>
                  <th>Margen %</th>
                </tr>
              </thead>
              <tbody>
                ${reportData!.clientesTop.map(cliente => `
                  <tr>
                    <td>${cliente.nombre}</td>
                    <td>${CurrencyUtils.formatAmount(cliente.ventas)}</td>
                    <td>${cliente.obras}</td>
                    <td>${cliente.margen}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Crear ventana para imprimir
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

  const reportTypes = [
    { value: 'general', label: 'Reporte General' },
    { value: 'ventas', label: 'Análisis de Ventas' },
    { value: 'financiero', label: 'Reporte Financiero' },
    { value: 'clientes', label: 'Análisis de Clientes' },
    { value: 'rendimiento', label: 'Rendimiento por Obra' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600">Análisis avanzado del rendimiento del negocio</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportToExcel}>
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <HiOutlinePrinter className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Tipo de Reporte"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>

            <Input
              label="Fecha Desde"
              type="date"
              value={dateRange.desde}
              onChange={(e) => setDateRange(prev => ({ ...prev, desde: e.target.value }))}
            />

            <Input
              label="Fecha Hasta"
              type="date"
              value={dateRange.hasta}
              onChange={(e) => setDateRange(prev => ({ ...prev, hasta: e.target.value }))}
            />

            <div className="flex items-end">
              <Button onClick={generateReport} className="w-full">
                <HiOutlineFilter className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineCash className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Ventas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {CurrencyUtils.formatAmount(reportData.kpis.totalVentas)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineTrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Margen Promedio</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {reportData.kpis.margenPromedio}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineCalendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tiempo Prom. Entrega</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {reportData.kpis.tiempoPromedioEntrega} días
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineUsers className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Clientes Activos</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {reportData.kpis.clientesActivos}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineClipboardCheck className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Conversión</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {reportData.kpis.conversionPresupuestos}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolución de Ventas */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ventas Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.ventasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'ventas' ? CurrencyUtils.formatAmount(Number(value)) : value,
                          name === 'ventas' ? 'Ventas' : name === 'presupuestos' ? 'Presupuestos' : 'Obras'
                        ]}
                      />
                      <Area type="monotone" dataKey="ventas" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Análisis Financiero */}
            <Card>
              <CardHeader>
                <CardTitle>Análisis Financiero Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.analisisFinanciero}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => CurrencyUtils.formatAmount(Number(value))}
                      />
                      <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                      <Bar dataKey="costos" fill="#ef4444" name="Costos" />
                      <Bar dataKey="ganancia" fill="#3b82f6" name="Ganancia" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Clientes por Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.clientesTop.map((cliente, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{cliente.nombre}</p>
                        <p className="text-sm text-gray-500">{cliente.obras} obras</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {CurrencyUtils.formatAmount(cliente.ventas)}
                        </p>
                        <p className="text-sm text-green-600">Margen: {cliente.margen}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribución de Estados */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Estados de Obras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.distribucionEstados}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.distribucionEstados.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Rendimiento por Obra */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Obra</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Obra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Presupuesto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo Real
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margen %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Días
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Desviación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.rendimientoPorObra.map((obra, index) => {
                      const desviacion = ((obra.real - obra.presupuesto) / obra.presupuesto) * 100;
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {obra.obra}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {CurrencyUtils.formatAmount(obra.presupuesto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {CurrencyUtils.formatAmount(obra.real)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              obra.margen >= 30 ? 'bg-green-100 text-green-800' :
                              obra.margen >= 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {obra.margen}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {obra.dias} días
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`${
                              desviacion <= 0 ? 'text-green-600' : 
                              desviacion <= 5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {desviacion > 0 ? '+' : ''}{desviacion.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}