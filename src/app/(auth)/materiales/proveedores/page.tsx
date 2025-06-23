// src/app/(auth)/materiales/proveedores/page.tsx
'use client';

import { useState } from 'react';
import { useProveedores, useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { ProveedorFormData, proveedorSchema } from '@/lib/validations/material';
import { ValidationUtils } from '@/lib/utils/validators';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExclamationCircle,
  HiOutlineOfficeBuilding,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker
} from 'react-icons/hi';
import React from 'react';

interface ProveedorFormProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor?: any;
  onSubmit: (data: ProveedorFormData) => Promise<void>;
}

function ProveedorForm({ isOpen, onClose, proveedor, onSubmit }: ProveedorFormProps) {
  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    cuit: '',
    notas: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        email: proveedor.email || '',
        telefono: proveedor.telefono || '',
        direccion: proveedor.direccion || '',
        cuit: proveedor.cuit || '',
        notas: proveedor.notas || ''
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        cuit: '',
        notas: ''
      });
    }
    setErrors({});
  }, [proveedor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = proveedorSchema.parse(formData);
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
      } else {
        setErrors({ general: error.message || 'Error al guardar proveedor' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ProveedorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
            <Input
              label="Nombre de la Empresa *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              error={errors.nombre}
              placeholder="Ej: Aluminios del Norte S.A."
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="contacto@proveedor.com"
          />

          <Input
            label="Teléfono"
            value={formData.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            error={errors.telefono}
            placeholder="+54 11 1234-5678"
          />

          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              error={errors.direccion}
              placeholder="Av. Industrial 1234, Buenos Aires"
            />
          </div>

          <Input
            label="CUIT"
            value={formData.cuit}
            onChange={(e) => handleChange('cuit', e.target.value)}
            error={errors.cuit}
            placeholder="30-12345678-9"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Información adicional sobre el proveedor..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {proveedor ? 'Actualizar' : 'Crear'} Proveedor
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProveedoresPage() {
  const [search, setSearch] = useState('');
  const [selectedProveedor, setSelectedProveedor] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { proveedores, loading, error, createProveedor, refetch } = useProveedores();
  const { materials } = useMaterials({ proveedorId: selectedProveedor?.id });

  // Filtrar proveedores por búsqueda
  const filteredProveedores = proveedores.filter(proveedor => 
    proveedor.nombre.toLowerCase().includes(search.toLowerCase()) ||
    proveedor.email?.toLowerCase().includes(search.toLowerCase()) ||
    proveedor.cuit?.includes(search)
  );

  const handleCreateProveedor = async (data: ProveedorFormData) => {
    await createProveedor(data);
    refetch();
  };

  const openDetailModal = (proveedor: any) => {
    setSelectedProveedor(proveedor);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedProveedor(null);
  };

  // Estadísticas
  const stats = {
    total: proveedores.length,
    activos: proveedores.filter(p => p.activo).length,
    conMateriales: proveedores.filter(p => p._count && p._count.materiales > 0).length,
    totalMateriales: proveedores.reduce((acc, p) => acc + (p._count?.materiales || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">Gestiona los proveedores de materiales</p>
        </div>
        <Button onClick={() => setIsFormModalOpen(true)}>
          <HiOutlinePlus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineOfficeBuilding className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">M</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Materiales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conMateriales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-xs font-bold">#</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Materiales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMateriales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o CUIT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <Button variant="outline" onClick={refetch}>
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar proveedores</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : filteredProveedores.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineOfficeBuilding className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proveedores</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'No se encontraron proveedores con esos criterios' : 'Comienza agregando tu primer proveedor'}
              </p>
            </div>
          ) : (
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
                {filteredProveedores.map((proveedor) => (
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
                          <div className="flex items-center text-sm text-gray-600">
                            <HiOutlineMail className="h-3 w-3 mr-1" />
                            {proveedor.email}
                          </div>
                        )}
                        {proveedor.telefono && (
                          <div className="flex items-center text-sm text-gray-600">
                            <HiOutlinePhone className="h-3 w-3 mr-1" />
                            {proveedor.telefono}
                          </div>
                        )}
                        {proveedor.direccion && (
                          <div className="flex items-center text-sm text-gray-600">
                            <HiOutlineLocationMarker className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-xs">{proveedor.direccion}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {proveedor.cuit || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailModal(proveedor)}
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProveedor(proveedor);
                            setIsFormModalOpen(true);
                          }}
                        >
                          <HiOutlinePencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <ProveedorForm
        isOpen={isFormModalOpen}
        onClose={closeModals}
        proveedor={selectedProveedor}
        onSubmit={handleCreateProveedor}
      />

      {/* Modal de detalle */}
      {selectedProveedor && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle: ${selectedProveedor.nombre}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Información del proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProveedor.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Código</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProveedor.codigo}</p>
              </div>
              {selectedProveedor.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.email}</p>
                </div>
              )}
              {selectedProveedor.telefono && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.telefono}</p>
                </div>
              )}
              {selectedProveedor.direccion && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.direccion}</p>
                </div>
              )}
              {selectedProveedor.cuit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">CUIT</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.cuit}</p>
                </div>
              )}
            </div>

            {/* Materiales del proveedor */}
            {materials && materials.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Materiales ({materials.length})
                </h4>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Material</TableHeaderCell>
                        <TableHeaderCell>Tipo</TableHeaderCell>
                        <TableHeaderCell>Precio</TableHeaderCell>
                        <TableHeaderCell>Stock</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{material.nombre}</div>
                              <div className="text-sm text-gray-500">{material.codigo}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-900">{material.tipo}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-900">
                              ${material.precioUnitario.toLocaleString()} / {material.unidadMedida}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${
                              material.stockActual <= material.stockMinimo 
                                ? 'text-red-600 font-medium'
                                : 'text-gray-900'
                            }`}>
                              {material.stockActual} {material.unidadMedida}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
              <Button onClick={() => {
                setIsDetailModalOpen(false);
                setIsFormModalOpen(true);
              }}>
                Editar Proveedor
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}