// src/app/(auth)/inventario/movimientos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { api } from '@/lib/utils/http';
import { DateUtils, CurrencyUtils } from '@/lib/utils/calculations';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineExclamationCircle,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineMinus
} from 'react-icons/hi';

interface Movimiento {
  id: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  referencia?: string;
  fecha: string;
  material: {
    id: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
  };
  user: {
    name: string;
  };
}

interface MovimientoFormData {
  materialId: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  motivo: string;
  referencia?: string;
}

interface MovimientoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MovimientoFormData) => Promise<void>;
}

function MovimientoForm({ isOpen, onClose, onSubmit }: MovimientoFormProps) {
  const [formData, setFormData] = useState<MovimientoFormData>({
    materialId: '',
    tipo: 'ENTRADA',
    cantidad: 0,
    motivo: '',
    referencia: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const { materials } = useMaterials();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (!formData.materialId) {
        throw new Error('Material es requerido');
      }
      if (formData.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      if (!formData.motivo) {
        throw new Error('El motivo es requerido');
      }

      await onSubmit(formData);
      setFormData({
        materialId: '',
        tipo: 'ENTRADA',
        cantidad: 0,
        motivo: '',
        referencia: ''
      });
      setSelectedMaterial(null);
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'Error al registrar movimiento' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaterialChange = (materialId: string) => {
    setFormData(prev => ({ ...prev, materialId }));
    const material = materials.find(m => m.id === materialId);
    setSelectedMaterial(material);
  };

  const motivosPredefinidos = {
    ENTRADA: ['Compra a proveedor', 'Devolución de obra', 'Ajuste por inventario', 'Transferencia interna'],
    SALIDA: ['Uso en obra', 'Venta directa', 'Transferencia', 'Material defectuoso', 'Pérdida'],
    AJUSTE: ['Corrección de inventario', 'Diferencia de conteo', 'Ajuste por sistema']
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Movimiento de Stock"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="md:col-span-2">
            <Select
              label="Material *"
              value={formData.materialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
            >
              <option value="">Seleccionar material</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.codigo} - {material.nombre}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Tipo de Movimiento *"
            value={formData.tipo}
            onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
          >
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </Select>

          <Input
            label="Cantidad *"
            type="number"
            value={formData.cantidad}
            onChange={(e) => setFormData(prev => ({ ...prev, cantidad: Number(e.target.value) }))}
            min="0.001"
            step="0.001"
          />

          <div className="md:col-span-2">
            <Select
              label="Motivo *"
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
            >
              <option value="">Seleccionar motivo</option>
              {motivosPredefinidos[formData.tipo].map(motivo => (
                <option key={motivo} value={motivo}>{motivo}</option>
              ))}
              <option value="Otro">Otro (especificar en referencia)</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Input
              label="Referencia (Opcional)"
              value={formData.referencia}
              onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
              placeholder="Ej: Compra #123, Obra ABC, etc."
            />
          </div>
        </div>

        {selectedMaterial && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Información del Material</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Stock actual:</span>
                <span className="ml-2 font-medium">{selectedMaterial.stockActual} {selectedMaterial.unidadMedida}</span>
              </div>
              <div>
                <span className="text-blue-700">Stock mínimo:</span>
                <span className="ml-2 font-medium">{selectedMaterial.stockMinimo} {selectedMaterial.unidadMedida}</span>
              </div>
              {formData.cantidad > 0 && (
                <div className="col-span-2">
                  <span className="text-blue-700">Stock resultante:</span>
                  <span className="ml-2 font-medium">
                    {formData.tipo === 'ENTRADA' 
                      ? selectedMaterial.stockActual + formData.cantidad
                      : formData.tipo === 'SALIDA'
                      ? selectedMaterial.stockActual - formData.cantidad
                      : formData.cantidad
                    } {selectedMaterial.unidadMedida}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
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

export default function MovimientosInventarioPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20
  });

  // Filtros
  const [filters, setFilters] = useState({
    materialId: '',
    tipo: '',
    fechaDesde: '',
    fechaHasta: '',
    search: ''
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const { materials } = useMaterials();

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
      searchParams.append('page', pagination.page.toString());
      searchParams.append('limit', pagination.limit.toString());

      const data = await api.get(`/api/inventario/movimientos?${searchParams}`);
      setMovimientos(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 20 });
    } catch (err: any) {
      console.error('Error fetching movimientos:', err);
      setError(err.message || 'Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovimiento = async (data: MovimientoFormData) => {
    try {
      await api.post('/api/inventario/movimientos', data);
      await fetchMovimientos();
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrar movimiento');
    }
  };

  const exportMovimientos = async () => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
      searchParams.append('export', 'true');

      const response = await fetch(`/api/inventario/movimientos/export?${searchParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al exportar datos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `movimientos-inventario-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error al exportar:', error);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, [pagination.page, JSON.stringify(filters)]);

  const getMovimientoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return <HiOutlineArrowUp className="h-4 w-4 text-green-600" />;
      case 'SALIDA':
        return <HiOutlineArrowDown className="h-4 w-4 text-red-600" />;
      case 'AJUSTE':
        return <HiOutlineMinus className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getMovimientoColor = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return 'bg-green-100 text-green-800';
      case 'SALIDA':
        return 'bg-red-100 text-red-800';
      case 'AJUSTE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Estadísticas
  const stats = {
    totalMovimientos: movimientos.length,
    entradas: movimientos.filter(m => m.tipo === 'ENTRADA').length,
    salidas: movimientos.filter(m => m.tipo === 'SALIDA').length,
    ajustes: movimientos.filter(m => m.tipo === 'AJUSTE').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos de Inventario</h1>
          <p className="text-gray-600">Historial de movimientos de stock de materiales</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportMovimientos}>
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsFormModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Registrar Movimiento
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineRefresh className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Movimientos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMovimientos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Entradas</p>
                <p className="text-2xl font-bold text-green-600">{stats.entradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Salidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.salidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <HiOutlineMinus className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ajustes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.ajustes}</p>
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
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Select
              value={filters.materialId}
              onChange={(e) => setFilters(prev => ({ ...prev, materialId: e.target.value }))}
            >
              <option value="">Todos los materiales</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.codigo} - {material.nombre}
                </option>
              ))}
            </Select>

            <Select
              value={filters.tipo}
              onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
            >
              <option value="">Todos los tipos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SALIDA">Salidas</option>
              <option value="AJUSTE">Ajustes</option>
            </Select>

            <Input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
              placeholder="Fecha desde"
            />

            <Input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
              placeholder="Fecha hasta"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar movimientos</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineRefresh className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay movimientos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron movimientos con los filtros aplicados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Material</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Cantidad</TableHeaderCell>
                  <TableHeaderCell>Stock</TableHeaderCell>
                  <TableHeaderCell>Motivo</TableHeaderCell>
                  <TableHeaderCell>Usuario</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {DateUtils.formatDateTime(movimiento.fecha)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{movimiento.material.nombre}</div>
                        <div className="text-sm text-gray-500">{movimiento.material.codigo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMovimientoColor(movimiento.tipo)}`}>
                        {getMovimientoIcon(movimiento.tipo)}
                        <span className="ml-1">{movimiento.tipo}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className={`font-medium ${
                          movimiento.tipo === 'ENTRADA' ? 'text-green-600' : 
                          movimiento.tipo === 'SALIDA' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {movimiento.tipo === 'ENTRADA' ? '+' : movimiento.tipo === 'SALIDA' ? '-' : ''}
                          {movimiento.cantidad} {movimiento.material.unidadMedida}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{movimiento.stockAnterior} → {movimiento.stockNuevo}</div>
                        <div className="text-gray-500">{movimiento.material.unidadMedida}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{movimiento.motivo}</div>
                        {movimiento.referencia && (
                          <div className="text-gray-500">{movimiento.referencia}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">{movimiento.user.name}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} movimientos
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      <MovimientoForm
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateMovimiento}
      />
    </div>
  );
}