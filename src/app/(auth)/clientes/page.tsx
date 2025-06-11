// src/app/(auth)/clientes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useClients } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { ClienteFormData, clienteSchema } from '@/lib/validations/client';
import { DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: any;
  onSubmit: (data: ClienteFormData) => Promise<void>;
}

function ClienteForm({ isOpen, onClose, cliente, onSubmit }: ClienteFormProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    cuit: '',
    notas: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        cuit: cliente.cuit || '',
        notas: cliente.notas || ''
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
  }, [cliente, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = clienteSchema.parse(formData);
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
        setErrors({ general: error.message || 'Error al guardar cliente' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ClienteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
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
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              error={errors.nombre}
              placeholder="Razón social o nombre del cliente"
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="cliente@email.com"
          />

          <Input
            label="Teléfono"
            value={formData.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            error={errors.telefono}
            placeholder="+54 11 1234-5678"
          />

          <Input
            label="CUIT"
            value={formData.cuit}
            onChange={(e) => handleChange('cuit', e.target.value)}
            error={errors.cuit}
            placeholder="20-12345678-9"
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales sobre el cliente..."
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
            {cliente ? 'Actualizar' : 'Crear'} Cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { clients, loading, error, createClient, updateClient, deleteClient, refetch } = useClients({
    search: search.length >= 2 ? search : undefined
  });

  const handleCreateClient = async (data: ClienteFormData) => {
    await createClient(data);
    refetch();
  };

  const handleUpdateClient = async (data: ClienteFormData) => {
    if (selectedCliente) {
      await updateClient(selectedCliente.id, data);
      refetch();
    }
  };

  const handleDeleteClient = async (cliente: any) => {
    if (confirm(`¿Estás seguro de eliminar el cliente "${cliente.nombre}"?`)) {
      await deleteClient(cliente.id);
      refetch();
    }
  };

  const openEditModal = (cliente: any) => {
    setSelectedCliente(cliente);
    setIsFormModalOpen(true);
  };

  const openDetailModal = (cliente: any) => {
    setSelectedCliente(cliente);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedCliente(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona la información de tus clientes</p>
        </div>
        <Button onClick={() => setIsFormModalOpen(true)}>
          <HiOutlinePlus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineUsers className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineMail className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Email</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.email).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlinePhone className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Teléfono</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.telefono).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineLocationMarker className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Dirección</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.direccion).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
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

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar clientes</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'No se encontraron clientes con ese criterio' : 'Comienza agregando tu primer cliente'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Contacto</TableHeaderCell>
                  <TableHeaderCell>CUIT</TableHeaderCell>
                  <TableHeaderCell>Creado</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{cliente.nombre}</div>
                        <div className="text-sm text-gray-500">{cliente.codigo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.email && (
                          <div className="flex items-center text-sm text-gray-900">
                            <HiOutlineMail className="h-4 w-4 mr-1 text-gray-400" />
                            {cliente.email}
                          </div>
                        )}
                        {cliente.telefono && (
                          <div className="flex items-center text-sm text-gray-900">
                            <HiOutlinePhone className="h-4 w-4 mr-1 text-gray-400" />
                            {cliente.telefono}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {cliente.cuit || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {DateUtils.formatDate(cliente.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailModal(cliente)}
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(cliente)}
                        >
                          <HiOutlinePencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(cliente)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
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
      <ClienteForm
        isOpen={isFormModalOpen}
        onClose={closeModals}
        cliente={selectedCliente}
        onSubmit={selectedCliente ? handleUpdateClient : handleCreateClient}
      />

      {/* Modal de detalle */}
      {selectedCliente && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeModals}
          title={`Detalle: ${selectedCliente.nombre}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCliente.codigo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCliente.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCliente.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCliente.telefono || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CUIT</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCliente.cuit || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Creado</label>
                <p className="mt-1 text-sm text-gray-900">
                  {DateUtils.formatDateTime(selectedCliente.createdAt)}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCliente.direccion || '-'}</p>
              </div>
              {selectedCliente.notas && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCliente.notas}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={closeModals}>
                Cerrar
              </Button>
              <Button onClick={() => {
                closeModals();
                openEditModal(selectedCliente);
              }}>
                Editar Cliente
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}