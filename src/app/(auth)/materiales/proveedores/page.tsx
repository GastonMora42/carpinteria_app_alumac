// src/app/(auth)/materiales/proveedores/page.tsx
'use client';

import { useState } from 'react';
import { useProveedores } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { DateUtils } from '@/lib/utils/calculations';
import { ProveedorFormData, proveedorSchema } from '@/lib/validations/material';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineTruck,
  HiOutlineExclamationCircle,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineDownload,
  HiOutlineClipboardList,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';

interface ProveedorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProveedorFormData) => Promise<void>;
  proveedor?: any;
}

function ProveedorForm({ isOpen, onClose, onSubmit, proveedor }: ProveedorFormProps) {
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

  useState(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        email: proveedor.email || '',
        telefono: proveedor.telefono || '',
        direccion: proveedor.direccion || '',
        cuit: proveedor.cuit || '',
        notas: proveedor.notas || ''
      });
    }
  }, [proveedor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = proveedorSchema.parse(formData);
      await onSubmit(validatedData);
      onClose();
      
      // Reset form
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        cuit: '',
        notas: ''
      });
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
          <div className="md:col-span-2">
            <Input
              label="Nombre de la Empresa *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              error={errors.nombre}
              placeholder="Nombre del proveedor"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="email@proveedor.com"
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
              placeholder="Dirección completa"
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
            {errors.notas && (
              <p className="mt-1 text-sm text-red-600">{errors.notas}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
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
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { proveedores, loading, error, createProveedor, refetch } = useProveedores();

  const handleCreateProveedor = async (data: ProveedorFormData) => {
    await createProveedor(data);
    refetch();
  };

  const handleUpdateProveedor = async (data: ProveedorFormData) => {
    if (selectedProveedor) {
      // Por ahora solo creamos, la actualización se puede implementar después
      console.log('Update proveedor:', selectedProveedor.id, data);
      refetch();
    }
  };

  const openEditModal = (proveedor: any) => {
    setSelectedProveedor(proveedor);
    setIsProveedorModalOpen(true);
  };

  const openDetailModal = (proveedor: any) => {
    setSelectedProveedor(proveedor);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsProveedorModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedProveedor(null);
  };

  // Filtrar proveedores
  const filteredProveedores = proveedores.filter(proveedor => {
    const matchesSearch = proveedor.nombre.toLowerCase().includes(search.toLowerCase()) ||
                         proveedor.email?.toLowerCase().includes(search.toLowerCase()) ||
                         proveedor.telefono?.includes(search);
    return matchesSearch;
  });

  // Estadísticas
  const stats = {
    totalProveedores: proveedores.length,
    proveedoresActivos: proveedores.filter(p => p.activo).length,
    totalMateriales: proveedores.reduce((acc, p) => acc + (p._count?.materiales || 0), 0),
    proveedoresConEmail: proveedores.filter(p => p.email).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">Gestión de proveedores y contactos</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <HiOutlineDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsProveedorModalOpen(true)}>
            <HiOutlinePlus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineTruck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProveedores}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineOfficeBuilding className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.proveedoresActivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClipboardList className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Materiales Suministrados</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalMateriales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineMail className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Email</p>
                <p className="text-2xl font-bold text-orange-600">{stats.proveedoresConEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar proveedores por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Button variant="outline" onClick={refetch} className="w-full">
              Actualizar Lista
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
              <HiOutlineTruck className="mx-auto h-12 w-12 text-gray-400" />
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
                  <TableHeaderCell>Ubicación</TableHeaderCell>
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
                        {proveedor.cuit && (
                          <div className="text-xs text-gray-400">CUIT: {proveedor.cuit}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {proveedor.email && (
                          <div className="flex items-center text-sm text-gray-900">
                            <HiOutlineMail className="h-4 w-4 mr-1 text-gray-400" />
                            {proveedor.email}
                          </div>
                        )}
                        {proveedor.telefono && (
                          <div className="flex items-center text-sm text-gray-500">
                            <HiOutlinePhone className="h-4 w-4 mr-1 text-gray-400" />
                            {proveedor.telefono}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {proveedor.direccion ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <HiOutlineLocationMarker className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="max-w-xs truncate">{proveedor.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin dirección</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {proveedor._count?.materiales || 0} materiales
                        </span>
                      </div>
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
                          onClick={() => openEditModal(proveedor)}
                        >
                          <HiOutlinePencil className="h-4 w-4" />
                        </Button>
                        {proveedor.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`mailto:${proveedor.email}`)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <HiOutlineMail className="h-4 w-4" />
                          </Button>
                        )}
                        {proveedor.telefono && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`tel:${proveedor.telefono}`)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <HiOutlinePhone className="h-4 w-4" />
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
      <ProveedorForm
        isOpen={isProveedorModalOpen}
        onClose={closeModals}
        onSubmit={selectedProveedor ? handleUpdateProveedor : handleCreateProveedor}
        proveedor={selectedProveedor}
      />

      {/* Modal de detalle */}
      {selectedProveedor && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle: ${selectedProveedor.nombre}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Información del proveedor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Proveedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.nombre}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.codigo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.email || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.telefono || 'No especificado'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.direccion || 'No especificada'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CUIT</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.cuit || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedProveedor.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedProveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
              </div>
              {selectedProveedor.notas && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProveedor.notas}</p>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Estadísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Materiales Suministrados</label>
                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    {selectedProveedor._count?.materiales || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registrado Desde</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {DateUtils.formatDate(selectedProveedor.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
              <Button onClick={() => {
                closeModals();
                openEditModal(selectedProveedor);
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