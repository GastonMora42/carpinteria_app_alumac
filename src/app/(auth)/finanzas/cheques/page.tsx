// src/app/(auth)/finanzas/cheques/page.tsx
'use client';

import { useState } from 'react';
import { useCheques } from '@/hooks/use-cheques';
import { useClients } from '@/hooks/use-clients';
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
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineRefresh
} from 'react-icons/hi';

interface ChequeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

function ChequeForm({ isOpen, onClose, onSubmit }: ChequeFormProps) {
  const [formData, setFormData] = useState({
    numero: '',
    banco: '',
    sucursal: '',
    cuit: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    monto: 0,
    moneda: 'PESOS' as const,
    clienteId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { clients } = useClients();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        numero: '',
        banco: '',
        sucursal: '',
        cuit: '',
        fechaEmision: new Date().toISOString().split('T')[0],
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        monto: 0,
        moneda: 'PESOS',
        clienteId: ''
      });
    } catch (error: any) {
      setErrors({ general: error.message || 'Error al guardar cheque' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Cheque"
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
          <Input
            label="Número de Cheque *"
            value={formData.numero}
            onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
            placeholder="12345678"
            required
          />

          <Input
            label="Banco *"
            value={formData.banco}
            onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
            placeholder="Banco Nación"
            required
          />

          <Input
            label="Sucursal"
            value={formData.sucursal}
            onChange={(e) => setFormData(prev => ({ ...prev, sucursal: e.target.value }))}
            placeholder="001"
          />

          <Input
            label="CUIT"
            value={formData.cuit}
            onChange={(e) => setFormData(prev => ({ ...prev, cuit: e.target.value }))}
            placeholder="20-12345678-9"
          />

          <Input
            label="Fecha de Emisión *"
            type="date"
            value={formData.fechaEmision}
            onChange={(e) => setFormData(prev => ({ ...prev, fechaEmision: e.target.value }))}
            required
          />

          <Input
            label="Fecha de Vencimiento *"
            type="date"
            value={formData.fechaVencimiento}
            onChange={(e) => setFormData(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
            required
          />

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

          <div className="md:col-span-2">
            <Select
              label="Cliente"
              value={formData.clienteId}
              onChange={(e) => setFormData(prev => ({ ...prev, clienteId: e.target.value }))}
            >
              <option value="">Seleccionar cliente (opcional)</option>
              {clients.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Registrar Cheque
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EstadoChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheque: any;
  onSubmit: (estado: string, datos?: any) => Promise<void>;
}

function EstadoChequeModal({ isOpen, onClose, cheque, onSubmit }: EstadoChequeModalProps) {
  const [estado, setEstado] = useState('');
  const [fechaCobro, setFechaCobro] = useState(new Date().toISOString().split('T')[0]);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const datos: any = {};
      if (estado === 'COBRADO' || estado === 'DEPOSITADO') {
        datos.fechaCobro = new Date(fechaCobro);
      }
      if (estado === 'RECHAZADO' && motivoRechazo) {
        datos.motivoRechazo = motivoRechazo;
      }

      await onSubmit(estado, datos);
      onClose();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const estadosDisponibles = [
    { value: 'DEPOSITADO', label: 'Depositar' },
    { value: 'COBRADO', label: 'Marcar como cobrado' },
    { value: 'RECHAZADO', label: 'Marcar como rechazado' },
    { value: 'ENDOSADO', label: 'Endosar' },
    { value: 'ANULADO', label: 'Anular' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cambiar Estado - Cheque ${cheque?.numero}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">Cheque:</span>
              <p className="text-blue-900">{cheque?.numero}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Banco:</span>
              <p className="text-blue-900">{cheque?.banco}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Monto:</span>
              <p className="text-blue-900">{CurrencyUtils.formatAmount(cheque?.monto, cheque?.moneda)}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Estado Actual:</span>
              <p className="text-blue-900">{cheque?.estado}</p>
            </div>
          </div>
        </div>

        <Select
          label="Nuevo Estado *"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          required
        >
          <option value="">Seleccionar estado</option>
          {estadosDisponibles.map(est => (
            <option key={est.value} value={est.value}>{est.label}</option>
          ))}
        </Select>

        {(estado === 'COBRADO' || estado === 'DEPOSITADO') && (
          <Input
            label="Fecha de Operación"
            type="date"
            value={fechaCobro}
            onChange={(e) => setFechaCobro(e.target.value)}
            required
          />
        )}

        {estado === 'RECHAZADO' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del Rechazo
            </label>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe el motivo del rechazo..."
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Cambiar Estado
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ChequesPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<any>(null);

  const { cheques, loading, error, createCheque, updateEstadoCheque, refetch } = useCheques({
    estado: estadoFilter || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined
  });

  const handleCreateCheque = async (data: any) => {
    await createCheque(data);
    refetch();
  };

  const handleCambiarEstado = async (estado: string, datos?: any) => {
    if (selectedCheque) {
      await updateEstadoCheque(selectedCheque.id, estado, datos);
      refetch();
    }
  };

  const openEstadoModal = (cheque: any) => {
    setSelectedCheque(cheque);
    setIsEstadoModalOpen(true);
  };

  const closeModals = () => {
    setIsChequeModalOpen(false);
    setIsEstadoModalOpen(false);
    setSelectedCheque(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'CARTERA': return 'bg-blue-100 text-blue-800';
      case 'DEPOSITADO': return 'bg-yellow-100 text-yellow-800';
      case 'COBRADO': return 'bg-green-100 text-green-800';
      case 'RECHAZADO': return 'bg-red-100 text-red-800';
      case 'ANULADO': return 'bg-gray-100 text-gray-800';
      case 'ENDOSADO': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'CARTERA': return <HiOutlineClock className="h-4 w-4" />;
      case 'DEPOSITADO': return <HiOutlineCash className="h-4 w-4" />;
      case 'COBRADO': return <HiOutlineCheck className="h-4 w-4" />;
      case 'RECHAZADO': return <HiOutlineX className="h-4 w-4" />;
      case 'ANULADO': return <HiOutlineX className="h-4 w-4" />;
      case 'ENDOSADO': return <HiOutlineRefresh className="h-4 w-4" />;
      default: return <HiOutlineClock className="h-4 w-4" />;
    }
  };

  // Calcular estadísticas
  const totalEnCartera = cheques.filter(c => c.estado === 'CARTERA').reduce((acc, c) => acc + Number(c.monto), 0);
  const totalCobrados = cheques.filter(c => c.estado === 'COBRADO').reduce((acc, c) => acc + Number(c.monto), 0);
  const chequesVencidos = cheques.filter(c => c.estado === 'CARTERA' && new Date(c.fechaVencimiento) < new Date()).length;
  const chequesVencenProximamente = cheques.filter(c => {
    const vencimiento = new Date(c.fechaVencimiento);
    const hoy = new Date();
    const en7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return c.estado === 'CARTERA' && vencimiento >= hoy && vencimiento <= en7Dias;
  }).length;

  const filteredCheques = cheques.filter(cheque => {
    const matchesSearch = cheque.numero.toLowerCase().includes(search.toLowerCase()) ||
                         cheque.banco.toLowerCase().includes(search.toLowerCase()) ||
                         cheque.cliente?.nombre.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Cheques</h1>
          <p className="text-gray-600">Control y seguimiento de cheques recibidos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsChequeModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nuevo Cheque
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En Cartera</p>
                <p className="text-lg font-bold text-blue-600">
                  {CurrencyUtils.formatAmount(totalEnCartera)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cobrados</p>
                <p className="text-lg font-bold text-green-600">
                  {CurrencyUtils.formatAmount(totalCobrados)}
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
                <p className="text-sm font-medium text-gray-500">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{chequesVencidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCalendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vencen en 7 días</p>
                <p className="text-2xl font-bold text-yellow-600">{chequesVencenProximamente}</p>
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
                placeholder="Buscar cheques..."
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
              <option value="CARTERA">En cartera</option>
              <option value="DEPOSITADO">Depositados</option>
              <option value="COBRADO">Cobrados</option>
              <option value="RECHAZADO">Rechazados</option>
              <option value="ENDOSADO">Endosados</option>
              <option value="ANULADO">Anulados</option>
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

      {/* Tabla de cheques */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cheques</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCheques.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cheques</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || estadoFilter ? 'No se encontraron cheques con esos criterios' : 'Comienza registrando tu primer cheque'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Cheque</TableHeaderCell>
                  <TableHeaderCell>Banco</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Monto</TableHeaderCell>
                  <TableHeaderCell>Vencimiento</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheques.map((cheque) => {
                  const vencimiento = new Date(cheque.fechaVencimiento);
                  const hoy = new Date();
                  const diasHastaVencimiento = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                  const estaVencido = diasHastaVencimiento < 0;
                  const venceProximamente = diasHastaVencimiento <= 7 && diasHastaVencimiento >= 0;

                  return (
                    <TableRow key={cheque.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{cheque.numero}</div>
                          <div className="text-sm text-gray-500">
                            Emitido: {DateUtils.formatDate(cheque.fechaEmision)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{cheque.banco}</div>
                          {cheque.sucursal && (
                            <div className="text-sm text-gray-500">Suc: {cheque.sucursal}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {cheque.cliente?.nombre || 'Sin cliente'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {CurrencyUtils.formatAmount(cheque.monto, cheque.moneda as Currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className={`text-sm font-medium ${
                            estaVencido ? 'text-red-600' : 
                            venceProximamente ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {DateUtils.formatDate(cheque.fechaVencimiento)}
                          </div>
                          <div className={`text-xs ${
                            estaVencido ? 'text-red-500' : 
                            venceProximamente ? 'text-yellow-500' : 'text-gray-500'
                          }`}>
                            {estaVencido ? `Vencido hace ${Math.abs(diasHastaVencimiento)} días` :
                             venceProximamente ? `Vence en ${diasHastaVencimiento} días` :
                             `${diasHastaVencimiento} días`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(cheque.estado)}`}>
                          {getEstadoIcon(cheque.estado)}
                          <span className="ml-1">{cheque.estado}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEstadoModal(cheque)}
                            disabled={cheque.estado === 'COBRADO' || cheque.estado === 'ANULADO'}
                          >
                            <HiOutlineEye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ChequeForm
        isOpen={isChequeModalOpen}
        onClose={closeModals}
        onSubmit={handleCreateCheque}
      />

      <EstadoChequeModal
        isOpen={isEstadoModalOpen}
        onClose={closeModals}
        cheque={selectedCheque}
        onSubmit={handleCambiarEstado}
      />
    </div>
  );
}