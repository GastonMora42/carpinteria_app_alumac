// src/app/(auth)/dashboard/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/use-dashboard';
import { CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PEDIDO } from '@/lib/utils/validators';
import Link from 'next/link';
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown
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

export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar datos</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button onClick={refetch} className="mt-4">
          <HiOutlineRefresh className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { estadisticas, transaccionesRecientes, presupuestosVencenProximamente, pedidosEnProceso, ventasPorDia, resumen } = data;

  // Datos para gráficos
  const ventasData = ventasPorDia.map((item: any, index: number) => ({
    dia: DateUtils.formatDate(item.fecha, 'EEE'),
    ventas: Number(item.total) || 0
  }));

  const estadosPresupuestos = [
    { name: 'Pendientes', value: estadisticas.totalPresupuestosPendientes, color: '#f59e0b' },
    { name: 'Aprobados', value: 8, color: '#10b981' },
    { name: 'Rechazados', value: 3, color: '#ef4444' }
  ];

  const estadosPedidos = [
    { name: 'En Proceso', value: estadisticas.totalPedidosPendientes, color: '#3b82f6' },
    { name: 'Listos', value: 5, color: '#10b981' },
    { name: 'Entregados', value: 12, color: '#6b7280' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen ejecutivo de tu negocio</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <HiOutlineDocumentText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Alertas importantes */}
      {(resumen.alertas.presupuestosVencen > 0 || resumen.alertas.pedidosAtrasados > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <HiOutlineExclamationCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Atención requerida</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {resumen.alertas.presupuestosVencen > 0 && (
                    <li>{resumen.alertas.presupuestosVencen} presupuesto(s) vencen pronto</li>
                  )}
                  {resumen.alertas.pedidosAtrasados > 0 && (
                    <li>{resumen.alertas.pedidosAtrasados} pedido(s) con retraso en entrega</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiOutlineUsers className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Clientes Totales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.totalClientes}
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
                <HiOutlineDocumentText className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Presupuestos Pendientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.totalPresupuestosPendientes}
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
                <HiOutlineClipboardCheck className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pedidos en Proceso
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.totalPedidosPendientes}
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
                <HiOutlineCash className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ventas del Mes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {CurrencyUtils.formatAmount(estadisticas.ventasMes)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas financieras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {CurrencyUtils.formatAmount(estadisticas.saldosPorCobrar)}
            </div>
            <p className="text-sm text-gray-600">Saldos pendientes de cobro</p>
            <div className="mt-4">
              <Link href="/finanzas/saldos">
                <Button variant="outline" size="sm">
                  Ver Detalle
                  <HiOutlineChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Flujo del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ingresos:</span>
                <span className="text-sm font-medium text-green-600">
                  {CurrencyUtils.formatAmount(estadisticas.ventasMes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Egresos:</span>
                <span className="text-sm font-medium text-red-600">
                  {CurrencyUtils.formatAmount(45000)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-sm font-medium">Neto:</span>
                <span className="text-sm font-bold text-blue-600">
                  {CurrencyUtils.formatAmount(estadisticas.ventasMes - 45000)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">vs Mes Anterior</span>
                <div className="flex items-center">
                  <HiOutlineTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Margen Promedio</span>
                <span className="text-sm font-medium">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ticket Promedio</span>
                <span className="text-sm font-medium">
                  {CurrencyUtils.formatAmount(125000)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas de los Últimos 7 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [CurrencyUtils.formatAmount(Number(value)), 'Ventas']}
                  />
                  <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Estados de presupuestos */}
        <Card>
          <CardHeader>
            <CardTitle>Estados de Presupuestos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosPresupuestos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadosPresupuestos.map((entry, index) => (
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

      {/* Listas de elementos importantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presupuestos que vencen pronto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Presupuestos por Vencer</CardTitle>
            <Link href="/presupuestos?estado=PENDIENTE">
              <Button variant="ghost" size="sm">
                Ver todos
                <HiOutlineChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {presupuestosVencenProximamente.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay presupuestos próximos a vencer</p>
            ) : (
              <div className="space-y-3">
                {presupuestosVencenProximamente.slice(0, 5).map((presupuesto: any) => (
                  <div key={presupuesto.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {presupuesto.numero}
                      </p>
                      <p className="text-xs text-gray-500">
                        {presupuesto.cliente.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {CurrencyUtils.formatAmount(presupuesto.total)}
                      </p>
                      <p className="text-xs text-red-600">
                        Vence: {DateUtils.formatDate(presupuesto.fechaValidez)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos en proceso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pedidos en Proceso</CardTitle>
            <Link href="/ventas?estado=EN_PROCESO">
              <Button variant="ghost" size="sm">
                Ver todos
                <HiOutlineChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pedidosEnProceso.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay pedidos en proceso</p>
            ) : (
              <div className="space-y-3">
                {pedidosEnProceso.slice(0, 5).map((pedido: any) => (
                  <div key={pedido.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pedido.numero}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pedido.cliente.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO]?.color === 'blue' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO]?.label}
                      </span>
                      {pedido.fechaEntrega && (
                        <p className="text-xs text-gray-500 mt-1">
                          Entrega: {DateUtils.formatDate(pedido.fechaEntrega)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transacciones recientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimas Transacciones</CardTitle>
          <Link href="/finanzas/transacciones">
            <Button variant="ghost" size="sm">
              Ver todas
              <HiOutlineChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transaccionesRecientes.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay transacciones recientes</p>
          ) : (
            <div className="space-y-3">
              {transaccionesRecientes.map((transaccion: any) => (
                <div key={transaccion.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      transaccion.tipo === 'INGRESO' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaccion.concepto}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaccion.cliente?.nombre || transaccion.proveedor?.nombre || 'Sin cliente/proveedor'}
                        {' • '}
                        {transaccion.medioPago?.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaccion.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaccion.tipo === 'INGRESO' ? '+' : '-'}
                      {CurrencyUtils.formatAmount(transaccion.monto)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {DateUtils.formatDate(transaccion.fecha)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}