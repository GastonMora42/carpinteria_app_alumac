// src/components/forms/MaterialConCompraForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { MaterialFormData, ProveedorFormData, materialSchema } from '@/lib/validations/material';
import { CompraMaterialFormData, compraMaterialSchema } from '@/lib/validations/compra-material';
import { TIPOS_MATERIAL } from '@/lib/utils/validators';
import { useMediosPago } from '@/hooks/use-medios-pago';
import { useVentas } from '@/hooks/use-ventas';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineExclamationCircle,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';

interface EnhancedMaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  material?: any;
  proveedores: any[];
  onSubmit: (materialData: MaterialFormData, compraData?: CompraMaterialFormData) => Promise<void>;
}

export default function MaterialConCompraForm({ 
  isOpen, 
  onClose, 
  material, 
  proveedores,
  onSubmit 
}: EnhancedMaterialFormProps) {
  const [activeTab, setActiveTab] = useState<'material' | 'compra'>('material');
  const [incluirCompra, setIncluirCompra] = useState(false);
  
  // Estados del formulario de material
  const [materialData, setMaterialData] = useState<MaterialFormData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'PERFIL',
    unidadMedida: '',
    precioUnitario: 0,
    moneda: 'PESOS',
    stockActual: 0,
    stockMinimo: 0,
    proveedorId: ''
  });

  // Estados del formulario de compra
  const [compraData, setCompraData] = useState<CompraMaterialFormData>({
    materialId: '',
    proveedorId: '',
    cantidad: 0,
    precioUnitario: 0,
    impuestos: 21,
    moneda: 'PESOS',
    numeroFactura: '',
    cuitProveedor: '',
    fechaCompra: new Date(),
    medioPagoId: '',
    estadoPago: 'PENDIENTE'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVentaSearch, setShowVentaSearch] = useState(false);

  // Hooks para datos
  const { mediosPago, loading: loadingMedios } = useMediosPago();
  const { ventas, loading: loadingVentas } = useVentas({ limit: 100 });

  useEffect(() => {
    if (material) {
      setMaterialData({
        codigo: material.codigo,
        nombre: material.nombre,
        descripcion: material.descripcion || '',
        tipo: material.tipo,
        unidadMedida: material.unidadMedida,
        precioUnitario: material.precioUnitario,
        moneda: material.moneda,
        stockActual: material.stockActual,
        stockMinimo: material.stockMinimo,
        proveedorId: material.proveedor.id
      });
      setIncluirCompra(false);
    } else {
      // Resetear formularios para nuevo material
      setMaterialData({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'PERFIL',
        unidadMedida: '',
        precioUnitario: 0,
        moneda: 'PESOS',
        stockActual: 0,
        stockMinimo: 0,
        proveedorId: ''
      });
      setCompraData({
        materialId: '',
        proveedorId: '',
        cantidad: 0,
        precioUnitario: 0,
        impuestos: 21,
        moneda: 'PESOS',
        numeroFactura: '',
        cuitProveedor: '',
        fechaCompra: new Date(),
        medioPagoId: '',
        estadoPago: 'PENDIENTE'
      });
      setIncluirCompra(true); // Por defecto incluir compra para materiales nuevos
    }
    setErrors({});
  }, [material, isOpen]);

  // Sincronizar datos entre formularios
  useEffect(() => {
    if (materialData.proveedorId) {
      setCompraData(prev => ({ 
        ...prev, 
        proveedorId: materialData.proveedorId,
        precioUnitario: materialData.precioUnitario,
        moneda: materialData.moneda
      }));
      
      // Buscar CUIT del proveedor
      const proveedor = proveedores.find(p => p.id === materialData.proveedorId);
      if (proveedor?.cuit) {
        setCompraData(prev => ({ ...prev, cuitProveedor: proveedor.cuit }));
      }
    }
  }, [materialData.proveedorId, materialData.precioUnitario, materialData.moneda, proveedores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validar datos del material
      const validatedMaterial = materialSchema.parse(materialData);
      
      let validatedCompra = undefined;
      if (incluirCompra) {
        // Validar datos de compra
        validatedCompra = compraMaterialSchema.parse({
          ...compraData,
          materialId: 'temp' // Se asignará después de crear el material
        });
      }

      await onSubmit(validatedMaterial, validatedCompra);
      onClose();
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path?.[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularTotales = () => {
    const subtotal = compraData.cantidad * compraData.precioUnitario;
    const impuestos = (subtotal * compraData.impuestos) / 100;
    const total = subtotal + impuestos;
    
    return { subtotal, impuestos, total };
  };

  const { subtotal, impuestos: montoImpuestos, total } = calcularTotales();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material ? 'Editar Material' : 'Nuevo Material con Compra'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('material')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'material'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiOutlineOfficeBuilding className="h-4 w-4 inline mr-2" />
              Datos del Material
            </button>
            
            {!material && (
              <button
                type="button"
                onClick={() => setActiveTab('compra')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'compra'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HiOutlineCurrencyDollar className="h-4 w-4 inline mr-2" />
                Datos de Compra
              </button>
            )}
          </nav>
        </div>

        {/* Checkbox para incluir compra (solo para materiales nuevos) */}
        {!material && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={incluirCompra}
                onChange={(e) => setIncluirCompra(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-blue-900">
                Registrar compra de material con factura
              </span>
            </label>
            <p className="ml-7 text-xs text-blue-700 mt-1">
              Esto generará automáticamente el movimiento de inventario y la transacción contable
            </p>
          </div>
        )}

        {/* Contenido de las tabs */}
        {activeTab === 'material' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Código *"
                value={materialData.codigo}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  codigo: e.target.value.toUpperCase() 
                }))}
                error={errors.codigo}
                placeholder="MAT-001"
              />

              <Select
                label="Proveedor *"
                value={materialData.proveedorId}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  proveedorId: e.target.value 
                }))}
                error={errors.proveedorId}
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </Select>

              <div className="md:col-span-2">
                <Input
                  label="Nombre del Material *"
                  value={materialData.nombre}
                  onChange={(e) => setMaterialData(prev => ({ 
                    ...prev, 
                    nombre: e.target.value 
                  }))}
                  error={errors.nombre}
                  placeholder="Nombre descriptivo del material"
                />
              </div>

              <Select
                label="Tipo *"
                value={materialData.tipo}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  tipo: e.target.value as any 
                }))}
              >
                {Object.entries(TIPOS_MATERIAL).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </Select>

              <Input
                label="Unidad de Medida *"
                value={materialData.unidadMedida}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  unidadMedida: e.target.value 
                }))}
                error={errors.unidadMedida}
                placeholder="metro, m2, unidad, kg"
              />

              <Input
                label="Precio Unitario *"
                type="number"
                value={materialData.precioUnitario}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  precioUnitario: Number(e.target.value) 
                }))}
                error={errors.precioUnitario}
                min="0"
                step="0.01"
              />

              <Select
                label="Moneda"
                value={materialData.moneda}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  moneda: e.target.value as any 
                }))}
              >
                <option value="PESOS">Pesos Argentinos</option>
                <option value="DOLARES">Dólares</option>
              </Select>

              <Input
                label="Stock Inicial"
                type="number"
                value={materialData.stockActual}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  stockActual: Number(e.target.value) 
                }))}
                min="0"
                step="0.001"
              />

              <Input
                label="Stock Mínimo"
                type="number"
                value={materialData.stockMinimo}
                onChange={(e) => setMaterialData(prev => ({ 
                  ...prev, 
                  stockMinimo: Number(e.target.value) 
                }))}
                min="0"
                step="0.001"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={materialData.descripcion}
                  onChange={(e) => setMaterialData(prev => ({ 
                    ...prev, 
                    descripcion: e.target.value 
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción detallada del material..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compra' && incluirCompra && (
          <div className="space-y-6">
            {/* Datos de la factura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiOutlineDocumentText className="h-5 w-5 mr-2" />
                  Datos de la Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Número de Factura *"
                    value={compraData.numeroFactura}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      numeroFactura: e.target.value 
                    }))}
                    error={errors.numeroFactura}
                    placeholder="0001-00001234"
                  />

                  <Input
                    label="CUIT del Proveedor *"
                    value={compraData.cuitProveedor}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      cuitProveedor: e.target.value 
                    }))}
                    error={errors.cuitProveedor}
                    placeholder="30-12345678-9"
                  />

                  <Input
                    label="Fecha de Compra *"
                    type="date"
                    value={compraData.fechaCompra instanceof Date ? 
                      compraData.fechaCompra.toISOString().split('T')[0] : 
                      compraData.fechaCompra
                    }
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      fechaCompra: new Date(e.target.value) 
                    }))}
                    error={errors.fechaCompra}
                  />

                  <Input
                    label="Fecha de Vencimiento"
                    type="date"
                    value={compraData.fechaVencimiento instanceof Date ? 
                      compraData.fechaVencimiento.toISOString().split('T')[0] : 
                      compraData.fechaVencimiento || ''
                    }
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      fechaVencimiento: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cantidades y precios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiOutlineCurrencyDollar className="h-5 w-5 mr-2" />
                  Cantidades y Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Cantidad *"
                    type="number"
                    value={compraData.cantidad}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      cantidad: Number(e.target.value) 
                    }))}
                    error={errors.cantidad}
                    min="0.001"
                    step="0.001"
                  />

                  <Input
                    label="Precio Unitario *"
                    type="number"
                    value={compraData.precioUnitario}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      precioUnitario: Number(e.target.value) 
                    }))}
                    error={errors.precioUnitario}
                    min="0"
                    step="0.01"
                  />

                  <Input
                    label="% Impuestos"
                    type="number"
                    value={compraData.impuestos}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      impuestos: Number(e.target.value) 
                    }))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                {/* Resumen de totales */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Resumen de la Compra</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Subtotal:</span>
                      <p className="font-semibold">${subtotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Impuestos:</span>
                      <p className="font-semibold">${montoImpuestos.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <p className="font-bold text-lg text-blue-600">${total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pago y estado */}
            <Card>
              <CardHeader>
                <CardTitle>Pago y Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Medio de Pago *"
                    value={compraData.medioPagoId}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      medioPagoId: e.target.value 
                    }))}
                    error={errors.medioPagoId}
                    disabled={loadingMedios}
                  >
                    <option value="">Seleccionar medio de pago</option>
                    {mediosPago.map(medio => (
                      <option key={medio.id} value={medio.id}>{medio.nombre}</option>
                    ))}
                  </Select>

                  <Select
                    label="Estado del Pago"
                    value={compraData.estadoPago}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      estadoPago: e.target.value as any 
                    }))}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PAGADO">Pagado</option>
                  </Select>

                  {compraData.estadoPago === 'PAGADO' && (
                    <Input
                      label="Fecha de Pago"
                      type="date"
                      value={compraData.fechaPago instanceof Date ? 
                        compraData.fechaPago.toISOString().split('T')[0] : 
                        compraData.fechaPago || ''
                      }
                      onChange={(e) => setCompraData(prev => ({ 
                        ...prev, 
                        fechaPago: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                    />
                  )}
                </div>

                {/* Vincular a obra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vincular a Obra (Opcional)
                  </label>
                  <div className="flex space-x-2">
                    <Select
                      value={compraData.ventaId || ''}
                      onChange={(e) => setCompraData(prev => ({ 
                        ...prev, 
                        ventaId: e.target.value || undefined 
                      }))}
                      disabled={loadingVentas}
                      className="flex-1"
                    >
                      <option value="">No vincular a obra específica</option>
                      {ventas.map(venta => (
                        <option key={venta.id} value={venta.id}>
                          {venta.numero} - {venta.cliente.nombre}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowVentaSearch(true)}
                    >
                      <HiOutlineSearch className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Al vincular a una obra, los costos se asignarán automáticamente al proyecto
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={compraData.observaciones || ''}
                    onChange={(e) => setCompraData(prev => ({ 
                      ...prev, 
                      observaciones: e.target.value 
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales sobre la compra..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          
          <div className="flex space-x-3">
            {activeTab === 'material' && !material && incluirCompra && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('compra')}
              >
                Siguiente: Datos de Compra
              </Button>
            )}
            
            <Button type="submit" loading={isSubmitting}>
              {material ? 'Actualizar Material' : 
               incluirCompra ? 'Crear Material y Registrar Compra' : 'Crear Material'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}