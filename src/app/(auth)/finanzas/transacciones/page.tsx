// src/app/(auth)/finanzas/transacciones/page.tsx
'use client';

import { useState } from 'react';
import { useTransacciones } from '@/hooks/use-transacciones';
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
  HiOutlineDownload,
  HiOutlineFilter
} from 'react-icons/hi';

interface TransaccionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaccion: any;
}

function TransaccionDetailModal({ isOpen, onClose, transaccion }: TransaccionDetailModalProps) {
  if (!transaccion) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transacción: ${transaccion.numero}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Información principal */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {transaccion.tipo.replace('_', ' ')}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <p className={`mt-1 text-lg font-bold ${
                ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo)
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(transaccion.tipo) ? '+' : '-'}
                {CurrencyUtils.formatAmount(transaccion.monto, transaccion.moneda)}
              </p>
            </div>
          </div>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <p className="mt-1 text-sm text-gray-900">
              {DateUtils.formatDateTime(transaccion.fecha)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Medio de Pago</label>
            <p className="mt-1 text-sm text-gray-900">{transaccion.medioPago?.nombre}</p>
          </div>
          
          {transaccion.cliente && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <p className="mt-1 text-sm text-gray-900">{transaccion.cliente.nombre}</p>
            </div>
          )}
          
          {transaccion.proveedor && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Proveedor</label>
              <p className="mt-1 text-sm text-gray-900">{transaccion.proveedor.nombre}</p>
            </div>
          )}

          {transaccion.numeroComprobante && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Comprobante</label>
              <p className="mt-1 text-sm text-gray-900">{transaccion.numeroComprobante}</p>
            </div>
          )}

          {transaccion.tipoComprobante && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Comprobante</label>
              <p className="mt-1 text-sm text-gray-900">{transaccion.tipoComprobante}</p>
            </div>
          )}
        </div>

        {/* Concepto y descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Concepto</label>
          <p className="mt-1 text-sm text-gray-900">{transaccion.concepto}</p>
        </div>

        {transaccion.descripcion && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <p className="mt-1 text-sm text-gray-900">{transaccion.descripcion}</p>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function TransaccionesPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedTransaccion, setSelectedTransaccion] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { transacciones, loading, error, refetch } = useTransacciones({
    tipo: tipoFilter || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined
  });

  const openDetailModal = (transaccion: any) => {
    setSelectedTransaccion(transaccion);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTransaccion(null);
  };

  // Calcular estadísticas
  const ingresos = transacciones.filter(t => ['INGRESO', 'ANTICIPO', 'PAGO_OBRA'].includes(t.tipo));
  const egresos = transacciones.filter(t => ['EGRESO', 'PAGO_PROVEEDOR', 'GASTO_GENERAL'].includes(t.tipo));

  const totalIngresos = ingresos.reduce((acc, t) => acc + Number(t.monto), 0);
  const totalEgresos = egresos.reduce((acc, t) => acc + Number(t.monto), 0);
  const flujoNeto = totalIngresos - totalEgresos;

  const tiposTransaccion = [
    { value: '', label: 'Todos los tipos' },
    { value: 'INGRESO', label: 'Ingresos' },
    { value: 'EGRESO', label: 'Egresos' },
    { value: 'ANTICIPO', label: 'Anticipos' },
    { value: 'PAGO_OBRA', label: 'Pagos de Obra' },
    { value: 'PAGO_PROVEEDOR', label: 'Pagos a Proveedores' },
    { value: 'GASTO_GENERAL', label: 'Gastos Generales' },
    { value: 'TRANSFERENCIA', label: 'Transferencias' },
    { value: 'AJUSTE', label: 'Ajustes' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
          <p className="text-gray-600">Historial completo de movimientos financieros</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Ingresos</p>
                <p className="text-lg font-bold text-green-600">
                  {CurrencyUtils.formatAmount(totalIngresos)}
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
                <p className="text-sm font-medium text-gray-500">Total Egresos</p>
                <p className="text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(totalEgresos)}
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
                <p className="text-sm font-medium text-gray-500">Flujo Neto</p>
                <p className={`text-lg font-bold ${flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {CurrencyUtils.formatAmount(flujoNeto)}
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
                <p className="text-sm font-medium text-gray-500">Transacciones</p>
                <p className="text-lg font-bold text-gray-900">{transacciones.length}</p>
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
          <CardTitle>Historial de Transacciones</CardTitle>
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
                Las transacciones aparecerán aquí cuando se registren movimientos
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Número</TableHeaderCell>
                  <TableHeaderCell>Concepto</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                  <TableHeaderCell>Relacionado</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacciones.map((transaccion) => (
                  <TableRow key={transaccion.id}>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {DateUtils.formatDate(transaccion.fecha)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{transaccion.numero}</div>
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
                      <div className="text-sm text-gray-900">
                        {transaccion.cliente?.nombre || transaccion.proveedor?.nombre || 
                         transaccion.pedido?.numero || '-'}
                      </div>
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

      {/* Modal de detalle */}
      <TransaccionDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeModal}
        transaccion={selectedTransaccion}
      />
    </div>
  );
}