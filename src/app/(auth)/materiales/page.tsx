// src/app/(auth)/materiales/page.tsx - ACTUALIZADO CON FUNCIONALIDAD DE COMPRAS
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { MaterialFormData, ProveedorFormData, materialSchema, proveedorSchema } from '@/lib/validations/material';
import { CompraMaterialFormData } from '@/lib/validations/compra-material';
import { TIPOS_MATERIAL } from '@/lib/utils/validators';
import { useMaterials, useProveedores } from '@/hooks/use-materials';
import { useComprasMateriales } from '@/hooks/use-compras-materiales';
import MaterialConCompraForm from '@/components/forms/MaterialConCompraForm';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDatabase,
  HiOutlineExclamationCircle,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineAdjustments,
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineShoppingCart,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar
} from 'react-icons/hi';

interface Material {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  unidadMedida: string;
  precioUnitario: number;
  moneda: string;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  proveedor: {
    id: string;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MovimientoStock {
  id: string;
  materialId: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  motivo: string;
  referencia?: string;
  fechaMovimiento: Date;
  usuario: string;
}

function ComprasRecentesModal({ isOpen, onClose, materialId }: {
  isOpen: boolean;
  onClose: () => void;
  materialId: string | null;
}) {
  const { compras, loading } = useComprasMateriales({ 
    materialId: materialId || undefined,
    limit: 10 
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compras Recientes del Material"
      size="xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : compras.length === 0 ? (
          <div className="text-center py-8">
            <HiOutlineShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin compras registradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay compras registradas para este material
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {compras.map((compra) => (
              <Card key={compra.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{compra.numero}</span>
                      <Badge 
                        variant={
                          compra.estadoPago === 'PAGADO' ? 'success' :
                          compra.estadoPago === 'VENCIDO' ? 'destructive' :
                          'warning'
                        }
                      >
                        {compra.estadoPago}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {compra.proveedor.nombre} - Factura: {compra.numeroFactura}
                    </p>
                    <p className="text-xs text-gray-500">
                      {DateUtils.formatDate(compra.fechaCompra)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {compra.cantidad} {compra.material.unidadMedida}
                    </div>
                    <div className="text-sm text-gray-600">
                      {CurrencyUtils.formatAmount(compra.total, compra.moneda as Currency)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MovimientoStockModal({ isOpen, onClose, material, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  material?: Material;
  onSubmit: (data: MovimientoStock) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    tipo: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE',
    cantidad: 0,
    motivo: '',
    referencia: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;

    setIsSubmitting(true);
    try {
      const movimiento: MovimientoStock = {
        id: Date.now().toString(),
        materialId: material.id,
        tipo: formData.tipo,
        cantidad: formData.cantidad,
        motivo: formData.motivo,
        referencia: formData.referencia,
        fechaMovimiento: new Date(),
        usuario: 'Usuario Actual'
      };
      
      await onSubmit(movimiento);
      onClose();
      setFormData({
        tipo: 'ENTRADA',
        cantidad: 0,
        motivo: '',
        referencia: ''
      });
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Movimiento de Stock - ${material?.nombre}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Material:</span>
              <p className="text-gray-900">{material?.nombre}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Stock Actual:</span>
              <p className="text-gray-900">{material?.stockActual} {material?.unidadMedida}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Movimiento *"
            value={formData.tipo}
            onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
          >
            <option value="ENTRADA">Entrada (Compra/Recepción)</option>
            <option value="SALIDA">Salida (Uso en Obra)</option>
            <option value="AJUSTE">Ajuste de Inventario</option>
          </Select>

          <Input
            label="Cantidad *"
            type="number"
            value={formData.cantidad}
            onChange={(e) => setFormData(prev => ({ ...prev, cantidad: Number(e.target.value) }))}
            min="0.001"
            step="0.001"
            required
          />
        </div>

        <Input
          label="Motivo *"
          value={formData.motivo}
          onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
          placeholder="Describe el motivo del movimiento"
          required
        />

        <Input
          label="Referencia"
          value={formData.referencia}
          onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
          placeholder="Número de factura, pedido, etc."
        />

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Registrar Movimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function MaterialesPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isComprasModalOpen, setIsComprasModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'materiales' | 'proveedores' | 'compras'>('materiales');

  // Hooks para datos
  const { materials, loading, error, refetch, updateStock } = useMaterials({
    search,
    tipo: tipoFilter as "critico" | "bajo" | "normal" | undefined,
    stockFilter: stockFilter as "critico" | "bajo" | "normal" | undefined
  });

  const { proveedores } = useProveedores();
  const { createCompra } = useComprasMateriales();

  // Crear material con compra integrada
  const handleCreateMaterialWithCompra = async (
    materialData: MaterialFormData,
    compraData?: CompraMaterialFormData
  ) => {
    try {
      console.log('🔧 Creating material with purchase integration...');
      
      if (!compraData) {
        // Solo crear material sin compra
        console.log('Creating material only');
        // Aquí iría la lógica para crear solo el material
        return;
      }

      // Crear material primero
      console.log('Creating material with purchase data');
      
      // Simular creación de material (en realidad deberías usar tu API)
      const newMaterial = {
        id: Date.now().toString(),
        ...materialData,
        stockActual: compraData.cantidad, // El stock inicial será la cantidad comprada
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        proveedor: proveedores.find(p => p.id === materialData.proveedorId) || proveedores[0]
      };

      // Crear la compra asociada
      const compraCompleta = {
        ...compraData,
        materialId: newMaterial.id,
      };

      await createCompra(compraCompleta);
      
      console.log('✅ Material and purchase created successfully');
      
      // Refrescar datos
      refetch();
      
    } catch (error) {
      console.error('❌ Error creating material with purchase:', error);
      throw error;
    }
  };

  const handleMovimientoStock = async (movimiento: MovimientoStock) => {
    await updateStock(movimiento.materialId, {
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      motivo: movimiento.motivo,
      referencia: movimiento.referencia
    });
  };

  // Filtrar materiales
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.nombre.toLowerCase().includes(search.toLowerCase()) ||
                         material.codigo.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = !tipoFilter || material.tipo === tipoFilter;
    const matchesStock = !stockFilter || 
                        (stockFilter === 'critico' && material.stockActual <= material.stockMinimo) ||
                        (stockFilter === 'bajo' && material.stockActual <= material.stockMinimo * 1.5) ||
                        (stockFilter === 'normal' && material.stockActual > material.stockMinimo * 1.5);
    
    return matchesSearch && matchesTipo && matchesStock;
  });

  // Estadísticas
  const stats = {
    totalMateriales: materials.length,
    stockCritico: materials.filter(m => m.stockActual <= m.stockMinimo).length,
    stockBajo: materials.filter(m => m.stockActual <= m.stockMinimo * 1.5 && m.stockActual > m.stockMinimo).length,
    valorInventario: materials.reduce((acc, m) => acc + (m.stockActual * m.precioUnitario), 0)
  };

  const openEditModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsMaterialModalOpen(true);
  };

  const openStockModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsStockModalOpen(true);
  };

  const openDetailModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsDetailModalOpen(true);
  };

  const openComprasModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsComprasModalOpen(true);
  };

  const closeModals = () => {
    setIsMaterialModalOpen(false);
    setIsStockModalOpen(false);
    setIsDetailModalOpen(false);
    setIsComprasModalOpen(false);
    setSelectedMaterial(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Materiales</h1>
          <p className="text-gray-600">Control de inventario, compras y proveedores</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsMaterialModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nuevo Material con Compra
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('materiales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'materiales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <HiOutlineDatabase className="h-4 w-4 inline mr-2" />
            Materiales
          </button>
          <button
            onClick={() => setActiveTab('proveedores')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'proveedores'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <HiOutlineTruck className="h-4 w-4 inline mr-2" />
            Proveedores
          </button>
          <button
            onClick={() => setActiveTab('compras')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compras'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <HiOutlineShoppingCart className="h-4 w-4 inline mr-2" />
            Compras
          </button>
        </nav>
      </div>

      {activeTab === 'materiales' && (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineDatabase className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Materiales</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalMateriales}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineExclamationCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Stock Crítico</p>
                    <p className="text-2xl font-bold text-red-600">{stats.stockCritico}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineAdjustments className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.stockBajo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <HiOutlineClipboardList className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Valor Inventario</p>
                    <p className="text-lg font-bold text-green-600">
                      {CurrencyUtils.formatAmount(stats.valorInventario)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar materiales..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <Select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  {Object.entries(TIPOS_MATERIAL).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </Select>

                <Select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="">Todo el stock</option>
                  <option value="critico">Stock crítico</option>
                  <option value="bajo">Stock bajo</option>
                  <option value="normal">Stock normal</option>
                </Select>

                <Button variant="outline" className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de materiales */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Materiales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Material</TableHeaderCell>
                    <TableHeaderCell>Tipo</TableHeaderCell>
                    <TableHeaderCell>Precio</TableHeaderCell>
                    <TableHeaderCell>Stock</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Proveedor</TableHeaderCell>
                    <TableHeaderCell>Acciones</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const stockStatus = material.stockActual <= material.stockMinimo ? 'critico' :
                                       material.stockActual <= material.stockMinimo * 1.5 ? 'bajo' : 'normal';
                    
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{material.nombre}</div>
                            <div className="text-sm text-gray-500">{material.codigo}</div>
                            {material.descripcion && (
                              <div className="text-xs text-gray-400 max-w-xs truncate">
                                {material.descripcion}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TIPOS_MATERIAL[material.tipo as keyof typeof TIPOS_MATERIAL]?.label || material.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {CurrencyUtils.formatAmount(material.precioUnitario, material.moneda as Currency)}
                            </div>
                            <div className="text-xs text-gray-500">
                              por {material.unidadMedida}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {material.stockActual} {material.unidadMedida}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Mín: {material.stockMinimo}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  stockStatus === 'critico' ? 'bg-red-500' :
                                  stockStatus === 'bajo' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, (material.stockActual / (material.stockMinimo * 2)) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              stockStatus === 'critico' ? 'destructive' :
                              stockStatus === 'bajo' ? 'warning' : 'success'
                            }
                          >
                            {stockStatus === 'critico' ? 'Crítico' :
                             stockStatus === 'bajo' ? 'Bajo' : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">{material.proveedor.nombre}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Tooltip content="Ver detalles">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailModal(material)}
                              >
                                <HiOutlineEye className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            
                            <Tooltip content="Editar material">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(material)}
                              >
                                <HiOutlinePencil className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            
                            <Tooltip content="Movimiento de stock">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openStockModal(material)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <HiOutlineAdjustments className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            
                            <Tooltip content="Ver compras">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openComprasModal(material)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <HiOutlineShoppingCart className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modals */}
      <MaterialConCompraForm
        isOpen={isMaterialModalOpen}
        onClose={closeModals}
        material={selectedMaterial || undefined}
        proveedores={proveedores}
        onSubmit={handleCreateMaterialWithCompra}
      />

      <MovimientoStockModal
        isOpen={isStockModalOpen}
        onClose={closeModals}
        material={selectedMaterial || undefined}
        onSubmit={handleMovimientoStock}
      />

      <ComprasRecentesModal
        isOpen={isComprasModalOpen}
        onClose={closeModals}
        materialId={selectedMaterial?.id || null}
      />

      {/* Modal de detalle */}
      {selectedMaterial && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle: ${selectedMaterial.nombre}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMaterial.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <p className="mt-1 text-sm text-gray-900">
                  {TIPOS_MATERIAL[selectedMaterial.tipo as keyof typeof TIPOS_MATERIAL]?.label}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio Unitario</label>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {CurrencyUtils.formatAmount(selectedMaterial.precioUnitario, selectedMaterial.moneda as Currency)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {selectedMaterial.stockActual} {selectedMaterial.unidadMedida}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
              <Button onClick={() => {
                closeModals();
                openStockModal(selectedMaterial);
              }}>
                Movimiento de Stock
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}