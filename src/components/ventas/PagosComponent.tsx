// src/components/ventas/PagosComponent.tsx - COMPONENTE REUTILIZABLE PARA PAGOS
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { TransaccionFormData } from '@/lib/validations/transaccion';
import {
  HiOutlineCash,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineCreditCard,
  HiOutlineCalendar,
  HiOutlineClipboard,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

interface Pago {
  id: string;
  numero: string;
  fecha: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  moneda: string;
  numeroComprobante?: string;
  tipoComprobante?: string;
  medioPago: {
    id: string;
    nombre: string;
  };
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface VentaInfo {
  id: string;
  numero: string;
  total: number;
  totalCobrado: number;
  saldoPendiente: number;
  moneda: string;
  cliente: {
    id: string;
    nombre: string;
  };
}

interface PagosComponentProps {
  venta: VentaInfo;
  pagos: Pago[];
  loading?: boolean;
  onRegistrarPago: (data: TransaccionFormData) => Promise<void>;
  onAnularPago?: (pagoId: string) => Promise<void>;
  showActions?: boolean;
  compact?: boolean;
}

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta: VentaInfo;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
}

function PagoModal({ isOpen, onClose, venta, onSubmit }: PagoModalProps) {
  const [formData, setFormData] = useState({
    monto: venta.saldoPendiente || 0,
    concepto: `Pago obra ${venta.numero}`,
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    medioPagoId: '',
    numeroComprobante: '',
    tipoComprobante: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    'Comprobante Digital',
    'Otro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validaciones básicas
      if (formData.monto <= 0) {
        setErrors({ monto: 'El monto debe ser mayor a 0' });
        return;
      }

      if (formData.monto > venta.saldoPendiente) {
        setErrors({ monto: 'El monto no puede ser mayor al saldo pendiente' });
        return;
      }

      if (!formData.medioPagoId) {
        setErrors({ medioPagoId: 'Debe seleccionar un medio de pago' });
        return;
      }

      const transaccionData: TransaccionFormData = {
        tipo: 'PAGO_OBRA',
        concepto: formData.concepto,
        descripcion: formData.descripcion,
        monto: Number(formData.monto),
        moneda: venta.moneda as 'PESOS' | 'DOLARES',
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
        monto: venta.saldoPendiente - formData.monto, // Actualizar con nuevo saldo
        concepto: `Pago obra ${venta.numero}`,
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        medioPagoId: '',
        numeroComprobante: '',
        tipoComprobante: ''
      });
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      setErrors({ general: error.message || 'Error al registrar pago' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const porcentajePago = venta.saldoPendiente > 0 ? (formData.monto / venta.saldoPendiente) * 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Pago - ${venta.numero}`}
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

        {/* Resumen financiero */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <HiOutlineCash className="h-5 w-5 mr-2" />
            Estado Financiero de la Venta
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">Total Venta:</span>
              <p className="text-lg font-bold text-blue-900">
                {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
              </p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Ya Cobrado:</span>
              <p className="text-lg font-bold text-green-700">
                {CurrencyUtils.formatAmount(venta.totalCobrado, venta.moneda as Currency)}
              </p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-blue-700">Saldo Pendiente:</span>
              <p className="text-2xl font-bold text-red-600">
                {CurrencyUtils.formatAmount(venta.saldoPendiente, venta.moneda as Currency)}
              </p>
            </div>
          </div>
          
          {/* Progreso visual */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-600 mb-1">
              <span>Progreso de Cobro</span>
              <span>{((venta.totalCobrado / venta.total) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(venta.totalCobrado / venta.total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Monto a Cobrar *"
              type="number"
              value={formData.monto}
              onChange={(e) => setFormData(prev => ({ ...prev, monto: Number(e.target.value) }))}
              max={venta.saldoPendiente}
              min="0.01"
              step="0.01"
              error={errors.monto}
              required
            />
            {formData.monto > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {porcentajePago.toFixed(1)}% del saldo pendiente
              </p>
            )}
          </div>

          <Select
            label="Medio de Pago *"
            value={formData.medioPagoId}
            onChange={(e) => setFormData(prev => ({ ...prev, medioPagoId: e.target.value }))}
            error={errors.medioPagoId}
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
          placeholder="Ej: REC-001, FC-A-123, etc."
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
            placeholder="Información adicional sobre el pago..."
          />
        </div>

        {/* Vista previa */}
        {formData.monto > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2 flex items-center">
              <HiOutlineClipboard className="h-4 w-4 mr-2" />
              Vista Previa del Pago
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Nuevo Total Cobrado:</span>
                <p className="font-bold text-green-900">
                  {CurrencyUtils.formatAmount(venta.totalCobrado + formData.monto, venta.moneda as Currency)}
                </p>
              </div>
              <div>
                <span className="text-green-700">Nuevo Saldo:</span>
                <p className="font-bold text-green-900">
                  {CurrencyUtils.formatAmount(venta.saldoPendiente - formData.monto, venta.moneda as Currency)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-green-700">Nuevo % Cobrado:</span>
              <p className="font-bold text-green-900">
                {(((venta.totalCobrado + formData.monto) / venta.total) * 100).toFixed(1)}%
              </p>
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

interface DetallePagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: Pago | null;
  onAnular?: (pagoId: string) => Promise<void>;
}

function DetallePagoModal({ isOpen, onClose, pago, onAnular }: DetallePagoModalProps) {
  const [isAnulando, setIsAnulando] = useState(false);

  if (!pago) return null;

  const handleAnular = async () => {
    if (!onAnular || !confirm('¿Está seguro de que desea anular este pago? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsAnulando(true);
      await onAnular(pago.id);
      onClose();
    } catch (error) {
      console.error('Error al anular pago:', error);
    } finally {
      setIsAnulando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle del Pago - ${pago.numero}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Header del pago */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-green-900">{pago.numero}</h3>
              <p className="text-green-700">{pago.concepto}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                +{CurrencyUtils.formatAmount(pago.monto, pago.moneda as Currency)}
              </p>
              <p className="text-sm text-green-500">
                {DateUtils.formatDate(pago.fecha)}
              </p>
            </div>
          </div>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Medio de Pago</label>
            <p className="mt-1 text-sm text-gray-900 flex items-center">
              <HiOutlineCreditCard className="h-4 w-4 mr-2 text-gray-400" />
              {pago.medioPago.nombre}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
            <p className="mt-1 text-sm text-gray-900 flex items-center">
              <HiOutlineCalendar className="h-4 w-4 mr-2 text-gray-400" />
              {DateUtils.formatDate(pago.fecha)}
            </p>
          </div>

          {pago.tipoComprobante && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Comprobante</label>
              <p className="mt-1 text-sm text-gray-900">{pago.tipoComprobante}</p>
            </div>
          )}

          {pago.numeroComprobante && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Comprobante</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{pago.numeroComprobante}</p>
            </div>
          )}
        </div>

        {pago.descripcion && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
              {pago.descripcion}
            </p>
          </div>
        )}

        {/* Información de auditoría */}
        <div className="bg-gray-50 p-4 rounded border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Registro</h4>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Registrado por:</span>
              <p>{pago.user.name}</p>
            </div>
            <div>
              <span className="font-medium">Fecha de registro:</span>
              <p>{DateUtils.formatDateTime(pago.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <div>
            {onAnular && (
              <Button 
                variant="danger" 
                onClick={handleAnular}
                loading={isAnulando}
                size="sm"
              >
                <HiOutlineTrash className="h-4 w-4 mr-2" />
                Anular Pago
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function PagosComponent({ 
  venta, 
  pagos, 
  loading = false, 
  onRegistrarPago, 
  onAnularPago,
  showActions = true,
  compact = false 
}: PagosComponentProps) {
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);

  const porcentajeCobrado = venta.total > 0 ? (venta.totalCobrado / venta.total) * 100 : 0;

  const openDetallePago = (pago: Pago) => {
    setSelectedPago(pago);
    setIsDetalleModalOpen(true);
  };

  const closeModals = () => {
    setIsPagoModalOpen(false);
    setIsDetalleModalOpen(false);
    setSelectedPago(null);
  };

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Pagos</CardTitle>
            {showActions && venta.saldoPendiente > 0 && (
              <Button size="sm" onClick={() => setIsPagoModalOpen(true)}>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Pago
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Cobrado:</span>
              <span className="font-medium text-green-600">
                {CurrencyUtils.formatAmount(venta.totalCobrado, venta.moneda as Currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pendiente:</span>
              <span className="font-medium text-red-600">
                {CurrencyUtils.formatAmount(venta.saldoPendiente, venta.moneda as Currency)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, porcentajeCobrado)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {porcentajeCobrado.toFixed(1)}% cobrado
            </div>
          </div>
        </CardContent>

        {/* Modals */}
        <PagoModal
          isOpen={isPagoModalOpen}
          onClose={closeModals}
          venta={venta}
          onSubmit={onRegistrarPago}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de pagos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cantidad Pagos</p>
                <p className="text-lg font-bold text-blue-600">{pagos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historial de Pagos</CardTitle>
            {showActions && venta.saldoPendiente > 0 && (
              <Button onClick={() => setIsPagoModalOpen(true)}>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pagos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los pagos recibidos aparecerán aquí
              </p>
              {showActions && venta.saldoPendiente > 0 && (
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
                        {pago.medioPago.nombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        {pago.tipoComprobante && (
                          <div className="text-sm text-gray-900">{pago.tipoComprobante}</div>
                        )}
                        {pago.numeroComprobante && (
                          <div className="text-xs text-gray-500 font-mono">{pago.numeroComprobante}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600 text-lg">
                        +{CurrencyUtils.formatAmount(pago.monto, pago.moneda as Currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDetallePago(pago)}
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                        {showActions && onAnularPago && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedPago(pago);
                              setIsDetalleModalOpen(true);
                            }}
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </Button>
                        )}
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
      <PagoModal
        isOpen={isPagoModalOpen}
        onClose={closeModals}
        venta={venta}
        onSubmit={onRegistrarPago}
      />

      <DetallePagoModal
        isOpen={isDetalleModalOpen}
        onClose={closeModals}
        pago={selectedPago}
        onAnular={onAnularPago}
      />
    </div>
  );
}