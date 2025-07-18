// src/app/(auth)/ventas/[id]/page.tsx - PÁGINA DE DETALLE CON PAGOS
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useVenta } from '@/hooks/use-ventas';
import { useTransacciones } from '@/hooks/use-transacciones';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PEDIDO } from '@/lib/utils/validators';
import { TransaccionFormData } from '@/lib/validations/transaccion';
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineDocumentReport,
  HiOutlinePrinter
} from 'react-icons/hi';

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
}

function PagoModal({ isOpen, onClose, venta, onSubmit }: PagoModalProps) {
  const [formData, setFormData] = useState({
    monto: venta?.saldoPendiente || 0,
    concepto: `Pago obra ${venta?.numero}`,
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    medioPagoId: '',
    numeroComprobante: '',
    tipoComprobante: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediosPago = [
    { id: '1', nombre: 'Efectivo' },
    { id: '2', nombre: 'Transferencia Bancaria' },
    { id: '3', nombre: 'Cheque' },
    { id: '4', nombre: 'Tarjeta de Débito' },
    { id: '5', nombre: 'Tarjeta de Crédito' },
    { id: '6', nombre: 'Mercado Pago' },
    { id: '7', nombre: 'Depósito Bancario' }
  ];

  const tiposComprobante = [
    'Recibo',
    'Factura A',
    'Factura B',
    'Factura C',
    'Nota de Crédito',
    'Comprobante de Transferencia',
    'Otro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const transaccionData: TransaccionFormData = {
        tipo: 'PAGO_OBRA',
        concepto: formData.concepto,
        descripcion: formData.descripcion,
        monto: Number(formData.monto),
        moneda: venta.moneda,
        fecha: new Date(formData.fecha),
        numeroComprobante: formData.numeroComprobante,
        tipoComprobante: formData.tipoComprobante,
        clienteId: venta.cliente.id,
        pedidoId: venta.id,
        medioPagoId: formData.medioPagoId
      };

      await onSubmit(transaccionData);
      onClose();
      
      // Reset form
      setFormData({
        monto: venta.saldoPendiente || 0,
        concepto: `Pago obra ${venta.numero}`,
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        medioPagoId: '',
        numeroComprobante: '',
        tipoComprobante: ''
      });
    } catch (error) {
      console.error('Error al registrar pago:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const porcentajeSaldoAcobrar = Math.min(100, Math.max(0, (formData.monto / (venta?.saldoPendiente || 1)) * 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Pago - ${venta?.numero}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resumen de la venta */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">Resumen de la Venta</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">Cliente:</span>
              <p className="text-blue-900">{venta?.cliente.nombre}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Total Obra:</span>
              <p className="text-blue-900">{CurrencyUtils.formatAmount(venta?.total, venta?.moneda)}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Ya Cobrado:</span>
              <p className="text-green-700 font-medium">
                {CurrencyUtils.formatAmount(venta?.totalCobrado, venta?.moneda)}
              </p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Saldo Pendiente:</span>
              <p className="text-lg font-bold text-red-600">
                {CurrencyUtils.formatAmount(venta?.saldoPendiente, venta?.moneda)}
              </p>
            </div>
          </div>
          
          {/* Barra de progreso de cobros */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-blue-600 mb-1">
              <span>Progreso de Cobro</span>
              <span>{((venta?.totalCobrado / venta?.total) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(venta?.totalCobrado / venta?.total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Formulario de pago */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              label="Monto a Cobrar *"
              type="number"
              value={formData.monto}
              onChange={(e) => setFormData(prev => ({ ...prev, monto: Number(e.target.value) }))}
              max={venta?.saldoPendiente}
              min="0.01"
              step="0.01"
              required
            />
            {formData.monto > 0 && (
              <p className="text-xs text-gray-500">
                Esto representa el {porcentajeSaldoAcobrar.toFixed(1)}% del saldo pendiente
              </p>
            )}
          </div>

          <Select
            label="Medio de Pago *"
            value={formData.medioPagoId}
            onChange={(e) => setFormData(prev => ({ ...prev, medioPagoId: e.target.value }))}
            required
          >
            <option value="">Seleccionar medio</option>
            {mediosPago.map(medio => (
              <option key={medio.id} value={medio.id}>{medio.nombre}</option>
            ))}
          </Select>

          <Input
            label="Fecha de Pago *"
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            required
          />

          <Select
            label="Tipo de Comprobante"
            value={formData.tipoComprobante}
            onChange={(e) => setFormData(prev => ({ ...prev, tipoComprobante: e.target.value }))}
          >
            <option value="">Seleccionar tipo</option>
            {tiposComprobante.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </Select>
        </div>

        <Input
          label="Número de Comprobante"
          value={formData.numeroComprobante}
          onChange={(e) => setFormData(prev => ({ ...prev, numeroComprobante: e.target.value }))}
          placeholder="Número de recibo, factura, etc."
        />

        <Input
          label="Concepto del Pago *"
          value={formData.concepto}
          onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
          placeholder="Describe el concepto del pago"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Información adicional del pago..."
          />
        </div>

        {/* Vista previa del pago */}
        {formData.monto > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Vista Previa del Pago</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Nuevo Total Cobrado:</span>
                <p className="font-bold text-green-900">
                  {CurrencyUtils.formatAmount((venta?.totalCobrado || 0) + formData.monto, venta?.moneda)}
                </p>
              </div>
              <div>
                <span className="text-green-700">Nuevo Saldo Pendiente:</span>
                <p className="font-bold text-green-900">
                  {CurrencyUtils.formatAmount((venta?.saldoPendiente || 0) - formData.monto, venta?.moneda)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <HiOutlineCash className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function VentaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { venta, loading, error } = useVenta(id);
  const { transacciones: pagos, createTransaccion, refetch: refetchPagos } = useTransacciones({
    pedidoId: id,
    tipo: 'PAGO_OBRA'
  });

  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando venta...</span>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="text-center py-12">
        <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {error || 'Venta no encontrada'}
        </h3>
        <div className="mt-4">
          <Button onClick={() => router.back()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const handleRegistrarPago = async (data: TransaccionFormData) => {
    await createTransaccion(data);
    refetchPagos();
    // La venta se actualizará automáticamente en el servidor
    window.location.reload(); // Recargar para obtener datos actualizados
  };

  const estadoInfo = ESTADOS_PEDIDO[venta.estado as keyof typeof ESTADOS_PEDIDO];
  const porcentajeCobrado = venta.total > 0 ? (venta.totalCobrado / venta.total) * 100 : 0;
  const totalPagos = pagos.reduce((acc, pago) => acc + Number(pago.monto), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-white hover:bg-blue-500"
            >
              <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{venta.numero}</h1>
              <p className="text-blue-100 mt-1">
                Venta para {venta.cliente.nombre}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-2xl font-bold">
                {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
              </div>
              <div className="text-blue-100 text-sm">
                Fecha: {DateUtils.formatDate(venta.fechaPedido)}
              </div>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
              estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
              estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {estadoInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineDocumentReport className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Venta</p>
                <p className="text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCash className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cobrado</p>
                <p className="text-lg font-bold text-green-600">
                  {CurrencyUtils.formatAmount(venta.totalCobrado, venta.moneda as Currency)}
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
                <p className="text-sm font-medium text-gray-500">Saldo Pendiente</p>
                <p className="text-lg font-bold text-red-600">
                  {CurrencyUtils.formatAmount(venta.saldoPendiente, venta.moneda as Currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCreditCard className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">% Cobrado</p>
                <p className="text-lg font-bold text-purple-600">
                  {porcentajeCobrado.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progreso de cobro */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Progreso de Cobro</h3>
            <span className="text-sm text-gray-500">
              {CurrencyUtils.formatAmount(venta.totalCobrado, venta.moneda as Currency)} de{' '}
              {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                porcentajeCobrado === 100 ? 'bg-green-500' :
                porcentajeCobrado >= 75 ? 'bg-blue-500' :
                porcentajeCobrado >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, porcentajeCobrado)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{porcentajeCobrado.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlinePrinter className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline">
            <HiOutlineDocumentReport className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        <div className="flex space-x-3">
          {venta.saldoPendiente > 0 && (
            <Button onClick={() => setIsPagoModalOpen(true)}>
              <HiOutlinePlus className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          )}
        </div>
      </div>

      {/* Historial de pagos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historial de Pagos</CardTitle>
            <span className="text-sm text-gray-500">
              {pagos.length} pago(s) registrado(s)
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pagos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pagos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los pagos recibidos aparecerán aquí
              </p>
              {venta.saldoPendiente > 0 && (
                <div className="mt-4">
                  <Button onClick={() => setIsPagoModalOpen(true)}>
                    <HiOutlinePlus className="h-4 w-4 mr-2" />
                    Registrar Primer Pago
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Concepto</TableHeaderCell>
                  <TableHeaderCell>Medio de Pago</TableHeaderCell>
                  <TableHeaderCell>Comprobante</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {DateUtils.formatDate(pago.fecha)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pago.numero}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{pago.concepto}</div>
                        {pago.descripcion && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {pago.descripcion}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {pago.medioPago?.nombre || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        {pago.tipoComprobante && (
                          <div className="text-sm text-gray-900">{pago.tipoComprobante}</div>
                        )}
                        {pago.numeroComprobante && (
                          <div className="text-xs text-gray-500">{pago.numeroComprobante}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600 text-lg">
                        +{CurrencyUtils.formatAmount(pago.monto, pago.moneda as Currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
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

      {/* Información de la venta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Cliente</label>
              <p className="text-lg font-semibold text-gray-900">{venta.cliente.nombre}</p>
            </div>
            {venta.cliente.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{venta.cliente.email}</p>
              </div>
            )}
            {venta.cliente.telefono && (
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-gray-900">{venta.cliente.telefono}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Número</label>
                <p className="font-mono text-lg font-bold text-blue-600">{venta.numero}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                  estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                  estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {estadoInfo.label}
                </span>
              </div>
            </div>
            
            {venta.descripcionObra && (
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="text-gray-900">{venta.descripcionObra}</p>
              </div>
            )}
            
            {venta.condicionesPago && (
              <div>
                <label className="text-sm font-medium text-gray-500">Condiciones de Pago</label>
                <p className="text-gray-900">{venta.condicionesPago}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de pago */}
      <PagoModal
        isOpen={isPagoModalOpen}
        onClose={() => setIsPagoModalOpen(false)}
        venta={venta}
        onSubmit={handleRegistrarPago}
      />
    </div>
  );
}