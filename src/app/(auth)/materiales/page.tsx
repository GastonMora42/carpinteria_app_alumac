// src/app/(auth)/materiales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { MaterialFormData, ProveedorFormData, materialSchema, proveedorSchema } from '@/lib/validations/material';
import { TIPOS_MATERIAL } from '@/lib/utils/validators';
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
  HiOutlineUpload
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

interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
  activo: boolean;
  createdAt: string;
  _count?: {
    materiales: number;
  };
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

// Mock data
const mockMateriales: Material[] = [
  {
    id: '1',
    codigo: 'ALU-001',
    nombre: 'Perfil de Aluminio 40x40',
    descripcion: 'Perfil cuadrado de aluminio 40x40mm',
    tipo: 'PERFIL',
    unidadMedida: 'metro',
    precioUnitario: 1500,
    moneda: 'PESOS',
    stockActual: 15,
    stockMinimo: 20,
    activo: true,
    proveedor: { id: '1', nombre: 'Aluminios SA' },
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01'
  },
  {
    id: '2',
    codigo: 'VID-001',
    nombre: 'Vidrio 4mm Transparente',
    descripcion: 'Vidrio float transparente 4mm',
    tipo: 'VIDRIO',
    unidadMedida: 'm2',
    precioUnitario: 2800,
    moneda: 'PESOS',
    stockActual: 25,
    stockMinimo: 10,
    activo: true,
    proveedor: { id: '2', nombre: 'Cristales del Sur' },
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01'
  },
  {
    id: '3',
    codigo: 'ACC-001',
    nombre: 'Bisagra Reforzada',
    descripcion: 'Bisagra reforzada para ventanas',
    tipo: 'ACCESORIO',
    unidadMedida: 'unidad',
    precioUnitario: 850,
    moneda: 'PESOS',
    stockActual: 5,
    stockMinimo: 50,
    activo: true,
    proveedor: { id: '3', nombre: 'Herrajes Premium' },
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01'
  }
];

const mockProveedores: Proveedor[] = [
  {
    id: '1',
    codigo: 'PROV-001',
    nombre: 'Aluminios SA',
    email: 'ventas@aluminios.com',
    telefono: '+54 11 1234-5678',
    direccion: 'Av. Industrial 1234',
    cuit: '30-12345678-9',
    activo: true,
    createdAt: '2024-01-01',
    _count: { materiales: 15 }
  },
  {
    id: '2',
    codigo: 'PROV-002',
    nombre: 'Cristales del Sur',
    email: 'info@cristales.com',
    telefono: '+54 11 8765-4321',
    direccion: 'Zona Industrial Sur',
    cuit: '30-87654321-0',
    activo: true,
    createdAt: '2024-01-01',
    _count: { materiales: 8 }
  }
];

function MaterialForm({ isOpen, onClose, material, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  material?: Material;
  onSubmit: (data: MaterialFormData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<MaterialFormData>({
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (material) {
      setFormData({
        codigo: material.codigo,
        nombre: material.nombre,
        descripcion: material.descripcion || '',
        tipo: material.tipo as any,
        unidadMedida: material.unidadMedida,
        precioUnitario: material.precioUnitario,
        moneda: material.moneda as any,
        stockActual: material.stockActual,
        stockMinimo: material.stockMinimo,
        proveedorId: material.proveedor.id
      });
    } else {
      setFormData({
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
    }
    setErrors({});
  }, [material, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = materialSchema.parse(formData);
      await onSubmit(validatedData);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material ? 'Editar Material' : 'Nuevo Material'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código *"
            value={formData.codigo}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
            error={errors.codigo}
            placeholder="ALU-001"
          />

          <Select
            label="Proveedor *"
            value={formData.proveedorId}
            onChange={(e) => setFormData(prev => ({ ...prev, proveedorId: e.target.value }))}
            error={errors.proveedorId}
          >
            <option value="">Seleccionar proveedor</option>
            {mockProveedores.map(prov => (
              <option key={prov.id} value={prov.id}>{prov.nombre}</option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              error={errors.nombre}
              placeholder="Nombre del material"
            />
          </div>

          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
          >
            {Object.entries(TIPOS_MATERIAL).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </Select>

          <Input
            label="Unidad de Medida *"
            value={formData.unidadMedida}
            onChange={(e) => setFormData(prev => ({ ...prev, unidadMedida: e.target.value }))}
            error={errors.unidadMedida}
            placeholder="metro, m2, unidad, kg"
          />

          <Input
            label="Precio Unitario *"
            type="number"
            value={formData.precioUnitario}
            onChange={(e) => setFormData(prev => ({ ...prev, precioUnitario: Number(e.target.value) }))}
            error={errors.precioUnitario}
            min="0"
            step="0.01"
          />

          <Select
            label="Moneda"
            value={formData.moneda}
            onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value as any }))}
          >
            <option value="PESOS">Pesos Argentinos</option>
            <option value="DOLARES">Dólares</option>
          </Select>

          <Input
            label="Stock Actual"
            type="number"
            value={formData.stockActual}
            onChange={(e) => setFormData(prev => ({ ...prev, stockActual: Number(e.target.value) }))}
            min="0"
            step="0.001"
          />

          <Input
            label="Stock Mínimo"
            type="number"
            value={formData.stockMinimo}
            onChange={(e) => setFormData(prev => ({ ...prev, stockMinimo: Number(e.target.value) }))}
            min="0"
            step="0.001"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción detallada del material..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {material ? 'Actualizar' : 'Crear'} Material
          </Button>
        </div>
      </form>
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
  const [materiales, setMateriales] = useState<Material[]>(mockMateriales);
  const [proveedores] = useState<Proveedor[]>(mockProveedores);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'materiales' | 'proveedores'>('materiales');

  const handleCreateMaterial = async (data: MaterialFormData) => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo,
      unidadMedida: data.unidadMedida,
      precioUnitario: data.precioUnitario,
      moneda: data.moneda,
      stockActual: data.stockActual || 0,
      stockMinimo: data.stockMinimo || 0,
      activo: true,
      proveedor: mockProveedores.find(p => p.id === data.proveedorId) || mockProveedores[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMateriales(prev => [newMaterial, ...prev]);
  };

  const handleUpdateMaterial = async (data: MaterialFormData) => {
    if (!selectedMaterial) return;
    setMateriales(prev => prev.map(m => 
      m.id === selectedMaterial.id 
        ? { ...m, ...data, proveedor: mockProveedores.find(p => p.id === data.proveedorId) || m.proveedor }
        : m
    ));
  };

  const handleMovimientoStock = async (movimiento: MovimientoStock) => {
    setMateriales(prev => prev.map(m => {
      if (m.id === movimiento.materialId) {
        let nuevoStock = m.stockActual;
        if (movimiento.tipo === 'ENTRADA') {
          nuevoStock += movimiento.cantidad;
        } else if (movimiento.tipo === 'SALIDA') {
          nuevoStock -= movimiento.cantidad;
        } else {
          nuevoStock = movimiento.cantidad; // Ajuste absoluto
        }
        return { ...m, stockActual: Math.max(0, nuevoStock) };
      }
      return m;
    }));
  };

  // Filtrar materiales
  const filteredMateriales = materiales.filter(material => {
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
    totalMateriales: materiales.length,
    stockCritico: materiales.filter(m => m.stockActual <= m.stockMinimo).length,
    stockBajo: materiales.filter(m => m.stockActual <= m.stockMinimo * 1.5 && m.stockActual > m.stockMinimo).length,
    valorInventario: materiales.reduce((acc, m) => acc + (m.stockActual * m.precioUnitario), 0)
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

  const closeModals = () => {
    setIsMaterialModalOpen(false);
    setIsStockModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedMaterial(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Materiales</h1>
          <p className="text-gray-600">Control de inventario y proveedores</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsMaterialModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nuevo Material
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
            Proveedores
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
                  {filteredMateriales.map((material) => {
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
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {TIPOS_MATERIAL[material.tipo as keyof typeof TIPOS_MATERIAL]?.label || material.tipo}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-500">
                            por {material.unidadMedida}
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
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            stockStatus === 'critico' ? 'bg-red-100 text-red-800' :
                            stockStatus === 'bajo' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {stockStatus === 'critico' ? 'Crítico' :
                             stockStatus === 'bajo' ? 'Bajo' : 'Normal'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">{material.proveedor.nombre}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailModal(material)}
                            >
                              <HiOutlineEye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(material)}
                            >
                              <HiOutlinePencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStockModal(material)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <HiOutlineAdjustments className="h-4 w-4" />
                            </Button>
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

      {activeTab === 'proveedores' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Proveedores</CardTitle>
              <Button>
                <HiOutlinePlus className="h-4 w-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Proveedor</TableHeaderCell>
                  <TableHeaderCell>Contacto</TableHeaderCell>
                  <TableHeaderCell>CUIT</TableHeaderCell>
                  <TableHeaderCell>Materiales</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{proveedor.nombre}</div>
                        <div className="text-sm text-gray-500">{proveedor.codigo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {proveedor.email && (
                          <div className="text-sm text-gray-900">{proveedor.email}</div>
                        )}
                        {proveedor.telefono && (
                          <div className="text-sm text-gray-500">{proveedor.telefono}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{proveedor.cuit || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {proveedor._count?.materiales || 0} materiales
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        proveedor.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <HiOutlinePencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <MaterialForm
        isOpen={isMaterialModalOpen}
        onClose={closeModals}
        material={selectedMaterial || undefined}
        onSubmit={selectedMaterial ? handleUpdateMaterial : handleCreateMaterial}
      />

      <MovimientoStockModal
        isOpen={isStockModalOpen}
        onClose={closeModals}
        material={selectedMaterial || undefined}
        onSubmit={handleMovimientoStock}
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