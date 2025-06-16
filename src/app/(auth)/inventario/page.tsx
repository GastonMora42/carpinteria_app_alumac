// src/app/(auth)/inventario/page.tsx - Stock Actual
'use client';

import { useState } from 'react';
import { useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils } from '@/lib/utils/calculations';
import { TIPOS_MATERIAL } from '@/lib/utils/validators';
import {
  HiOutlineSearch,
  HiOutlineDatabase,
  HiOutlineExclamationCircle,
  HiOutlineAdjustments,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineChartBar
} from 'react-icons/hi';

interface MovimientoStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  material?: any;
  onSubmit: (data: any) => Promise<void>;
}

function MovimientoStockModal({ isOpen, onClose, material, onSubmit }: MovimientoStockModalProps) {
  const [formData, setFormData] = useState({
    tipo: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE',
    cantidad: 0,
    motivo: '',
    referencia: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({ tipo: 'ENTRADA', cantidad: 0, motivo: '', referencia: '' });
    } catch (error) {
      console.error('Error:', error);
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
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">Material:</span>
              <p className="text-blue-900">{material?.nombre}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Stock Actual:</span>
              <p className="text-blue-900">{material?.stockActual} {material?.unidadMedida}</p>
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

export default function InventarioPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);

  const { materials, loading, error, updateStock, refetch } = useMaterials({
    search: search.length >= 2 ? search : undefined,
    tipo: tipoFilter || undefined,
    stockFilter: stockFilter as "critico" | "bajo" | "normal" | undefined
  });

  const handleMovimientoStock = async (movimiento: any) => {
    if (selectedMaterial) {
      await updateStock(selectedMaterial.id, movimiento);
      refetch();
    }
  };

  const openMovimientoModal = (material: any) => {
    setSelectedMaterial(material);
    setIsMovimientoModalOpen(true);
  };

  const closeModal = () => {
    setIsMovimientoModalOpen(false);
    setSelectedMaterial(null);
  };

  // Estadísticas
  const stats = {
    totalMateriales: materials.length,
    stockCritico: materials.filter(m => m.stockActual <= m.stockMinimo).length,
    stockBajo: materials.filter(m => m.stockActual <= m.stockMinimo * 1.5 && m.stockActual > m.stockMinimo).length,
    valorInventario: materials.reduce((acc, m) => acc + (m.stockActual * m.precioUnitario), 0)
  };

  const getStockStatus = (material: any) => {
    if (material.stockActual <= material.stockMinimo) {
      return { label: 'Crítico', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-500' };
    }
    if (material.stockActual <= material.stockMinimo * 1.5) {
      return { label: 'Bajo', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-500' };
    }
    return { label: 'Normal', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-500' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Actual</h1>
          <p className="text-gray-600">Control de inventario en tiempo real</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={refetch}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

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
              <HiOutlineChartBar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Valor Total</p>
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

            <Button variant="outline" onClick={() => {
              setSearch('');
              setTipoFilter('');
              setStockFilter('');
            }}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario Actual</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineDatabase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay materiales</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || tipoFilter || stockFilter ? 'No se encontraron materiales con esos criterios' : 'Comienza agregando materiales a tu inventario'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Material</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Stock Actual</TableHeaderCell>
                  <TableHeaderCell>Stock Mínimo</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Valor Stock</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const stockStatus = getStockStatus(material);
                  const valorStock = material.stockActual * material.precioUnitario;
                  const porcentajeStock = material.stockMinimo > 0 ? (material.stockActual / material.stockMinimo) * 100 : 100;
                  
                  return (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{material.nombre}</div>
                          <div className="text-sm text-gray-500">{material.codigo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {TIPOS_MATERIAL[material.tipo as keyof typeof TIPOS_MATERIAL]?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {material.stockActual} {material.unidadMedida}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${stockStatus.bgColor}`}
                              style={{ width: `${Math.min(100, porcentajeStock)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {material.stockMinimo} {material.unidadMedida}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {CurrencyUtils.formatAmount(valorStock, material.moneda as Currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMovimientoModal(material)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <HiOutlineAdjustments className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de movimiento */}
      <MovimientoStockModal
        isOpen={isMovimientoModalOpen}
        onClose={closeModal}
        material={selectedMaterial}
        onSubmit={handleMovimientoStock}
      />
    </div>
  );
}
