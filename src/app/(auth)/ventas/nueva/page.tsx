// src/app/(auth)/ventas/nueva/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '@/hooks/use-clients';
import { usePresupuestos } from '@/hooks/use-presupuestos';
import { useVentas } from '@/hooks/use-ventas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { VentaFormData, ventaSchema } from '@/lib/validations/venta';
import { CurrencyUtils } from '@/lib/utils/calculations';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCalendar
} from 'react-icons/hi';

export default function NuevaVentaPage() {
  const router = useRouter();
  const { clients } = useClients();
  const { presupuestos } = usePresupuestos({ estado: 'APROBADO' });
  const { createVenta } = useVentas();

  const [formData, setFormData] = useState<VentaFormData>({
    clienteId: '',
    presupuestoId: '',
    fechaEntrega: new Date(),
    prioridad: 'NORMAL',
    descripcionObra: '',
    observaciones: '',
    condicionesPago: '',
    lugarEntrega: '',
    descuento: 0,
    impuestos: 21,
    moneda: 'PESOS'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<any>(null);

  // Cuando se selecciona un presupuesto, llenar datos automáticamente
  useEffect(() => {
    if (formData.presupuestoId) {
      const presupuesto = presupuestos.find(p => p.id === formData.presupuestoId);
      if (presupuesto) {
        setSelectedPresupuesto(presupuesto);
        setFormData(prev => ({
          ...prev,
          clienteId: presupuesto.cliente.id,
          descripcionObra: presupuesto.descripcionObra || '',
          moneda: presupuesto.moneda as 'PESOS' | 'DOLARES'
        }));
      }
    } else {
      setSelectedPresupuesto(null);
    }
  }, [formData.presupuestoId, presupuestos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = ventaSchema.parse(formData);
      const newVenta = await createVenta(validatedData);
      router.push(`/ventas/${newVenta.id}`);
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
        setErrors({ general: error.message || 'Error al crear venta' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof VentaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <HiOutlineArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
            <p className="text-gray-600">Crea una nueva venta o pedido</p>
          </div>
        </div>
      </div>

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

        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineUsers className="h-5 w-5 mr-2" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Presupuesto Origen (Opcional)"
                value={formData.presupuestoId}
                onChange={(e) => handleChange('presupuestoId', e.target.value)}
                error={errors.presupuestoId}
              >
                <option value="">Venta directa (sin presupuesto)</option>
                {presupuestos.map(presupuesto => (
                  <option key={presupuesto.id} value={presupuesto.id}>
                    {presupuesto.numero} - {presupuesto.cliente.nombre}
                  </option>
                ))}
              </Select>

              <Select
                label="Cliente *"
                value={formData.clienteId}
                onChange={(e) => handleChange('clienteId', e.target.value)}
                error={errors.clienteId}
                disabled={!!selectedPresupuesto}
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nombre}
                  </option>
                ))}
              </Select>
            </div>

            {selectedPresupuesto && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Datos del Presupuesto: {selectedPresupuesto.numero}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Total:</span>
                    <p className="text-blue-900">
                      {CurrencyUtils.formatAmount(selectedPresupuesto.total, selectedPresupuesto.moneda)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Fecha Emisión:</span>
                    <p className="text-blue-900">
                      {new Date(selectedPresupuesto.fechaEmision).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Items:</span>
                    <p className="text-blue-900">{selectedPresupuesto.items?.length || 0} items</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalles del pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineDocumentText className="h-5 w-5 mr-2" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Prioridad"
                value={formData.prioridad}
                onChange={(e) => handleChange('prioridad', e.target.value)}
              >
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </Select>

              <Select
                label="Moneda"
                value={formData.moneda}
                onChange={(e) => handleChange('moneda', e.target.value)}
                disabled={!!selectedPresupuesto}
              >
                <option value="PESOS">Pesos Argentinos</option>
                <option value="DOLARES">Dólares</option>
              </Select>
            </div>

            <Input
              label="Descripción de la Obra *"
              value={formData.descripcionObra}
              onChange={(e) => handleChange('descripcionObra', e.target.value)}
              error={errors.descripcionObra}
              placeholder="Describe el trabajo a realizar..."
              disabled={!!selectedPresupuesto}
            />

            <Input
              label="Lugar de Entrega"
              value={formData.lugarEntrega}
              onChange={(e) => handleChange('lugarEntrega', e.target.value)}
              error={errors.lugarEntrega}
              placeholder="Dirección donde se entregará"
            />
          </CardContent>
        </Card>

        {/* Fechas y condiciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiOutlineCalendar className="h-5 w-5 mr-2" />
              Fechas y Condiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Entrega"
                type="date"
                value={formData.fechaEntrega ? formData.fechaEntrega.toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('fechaEntrega', new Date(e.target.value))}
                error={errors.fechaEntrega}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Descuento (%)"
                  type="number"
                  value={formData.descuento}
                  onChange={(e) => handleChange('descuento', Number(e.target.value))}
                  min="0"
                  max="100"
                  disabled={!!selectedPresupuesto}
                />
                <Input
                  label="Impuestos (%)"
                  type="number"
                  value={formData.impuestos}
                  onChange={(e) => handleChange('impuestos', Number(e.target.value))}
                  min="0"
                  max="100"
                  disabled={!!selectedPresupuesto}
                />
              </div>
            </div>

            <Input
              label="Condiciones de Pago"
              value={formData.condicionesPago}
              onChange={(e) => handleChange('condicionesPago', e.target.value)}
              placeholder="ej: 50% anticipo, 50% contra entrega"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observaciones adicionales del pedido..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => router.back()} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Crear Venta
          </Button>
        </div>
      </form>
    </div>
  );
}