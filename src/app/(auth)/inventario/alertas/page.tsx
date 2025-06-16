
// src/app/(auth)/inventario/alertas/page.tsx - Alertas de Stock Mínimo
'use client';

import { useState } from 'react';
import { useMaterials } from '@/hooks/use-materials';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { CurrencyUtils } from '@/lib/utils/calculations';
import { TIPOS_MATERIAL } from '@/lib/utils/validators';
import {
  HiOutlineExclamationCircle,
  HiOutlineShoppingCart,
  HiOutlineAdjustments,
  HiOutlineRefresh,
  HiOutlineMail
} from 'react-icons/hi';

export default function InventarioAlertasPage() {
  const { materials, loading, error, refetch } = useMaterials();

  // Filtrar materiales con stock crítico o bajo
  const materialesCriticos = materials.filter(m => m.stockActual <= m.stockMinimo);
  const materialesBajos = materials.filter(m => 
    m.stockActual <= m.stockMinimo * 1.5 && m.stockActual > m.stockMinimo
  );

  const handleGenerarOrdenCompra = (materiales: any[]) => {
    // Aquí iría la lógica para generar orden de compra
    console.log('Generando orden de compra para:', materiales);
  };

  const handleNotificarProveedor = (material: any) => {
    // Aquí iría la lógica para notificar al proveedor
    console.log('Notificando a proveedor de:', material);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas de Stock</h1>
          <p className="text-gray-600">Materiales que requieren reposición urgente</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={refetch}>
            <HiOutlineRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {(materialesCriticos.length > 0 || materialesBajos.length > 0) && (
            <Button onClick={() => handleGenerarOrdenCompra([...materialesCriticos, ...materialesBajos])}>
              <HiOutlineShoppingCart className="h-4 w-4 mr-2" />
              Generar Orden de Compra
            </Button>
          )}
        </div>
      </div>

      {/* Resumen de alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineExclamationCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-700">Stock Crítico</p>
                <p className="text-2xl font-bold text-red-800">{materialesCriticos.length}</p>
                <p className="text-xs text-red-600">Requiere reposición inmediata</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineExclamationCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-700">Stock Bajo</p>
                <p className="text-2xl font-bold text-yellow-800">{materialesBajos.length}</p>
                <p className="text-xs text-yellow-600">Planificar reposición pronto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineAdjustments className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Stock Normal</p>
                <p className="text-2xl font-bold text-green-800">
                  {materials.length - materialesCriticos.length - materialesBajos.length}
                </p>
                <p className="text-xs text-green-600">Sin problemas de stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Crítico */}
      {materialesCriticos.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center text-red-800">
              <HiOutlineExclamationCircle className="h-5 w-5 mr-2" />
              Stock Crítico - Acción Inmediata Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Material</TableHeaderCell>
                  <TableHeaderCell>Stock Actual</TableHeaderCell>
                  <TableHeaderCell>Stock Mínimo</TableHeaderCell>
                  <TableHeaderCell>Déficit</TableHeaderCell>
                  <TableHeaderCell>Proveedor</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialesCriticos.map((material) => {
                  const deficit = material.stockMinimo - material.stockActual;
                  return (
                    <TableRow key={material.id} className="bg-red-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{material.nombre}</div>
                          <div className="text-sm text-gray-500">{material.codigo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-red-600">
                          {material.stockActual} {material.unidadMedida}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">
                          {material.stockMinimo} {material.unidadMedida}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-red-600">
                          -{deficit} {material.unidadMedida}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{material.proveedor.nombre}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificarProveedor(material)}
                            className="text-blue-600"
                          >
                            <HiOutlineMail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                          >
                            <HiOutlineShoppingCart className="h-4 w-4" />
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
      )}

      {/* Stock Bajo */}
      {materialesBajos.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center text-yellow-800">
              <HiOutlineExclamationCircle className="h-5 w-5 mr-2" />
              Stock Bajo - Planificar Reposición
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Material</TableHeaderCell>
                  <TableHeaderCell>Stock Actual</TableHeaderCell>
                  <TableHeaderCell>Stock Mínimo</TableHeaderCell>
                  <TableHeaderCell>Días Estimados</TableHeaderCell>
                  <TableHeaderCell>Proveedor</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialesBajos.map((material) => {
                  // Estimación básica de días restantes (esto se podría mejorar con datos de consumo)
                  const diasEstimados = Math.round((material.stockActual - material.stockMinimo) / (material.stockMinimo * 0.1));
                  
                  return (
                    <TableRow key={material.id} className="bg-yellow-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{material.nombre}</div>
                          <div className="text-sm text-gray-500">{material.codigo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-yellow-700">
                          {material.stockActual} {material.unidadMedida}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">
                          {material.stockMinimo} {material.unidadMedida}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-yellow-700">
                          ~{diasEstimados} días
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{material.proveedor.nombre}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificarProveedor(material)}
                            className="text-blue-600"
                          >
                            <HiOutlineMail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                          >
                            <HiOutlineShoppingCart className="h-4 w-4" />
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
      )}

      {/* Sin alertas */}
      {materialesCriticos.length === 0 && materialesBajos.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <HiOutlineAdjustments className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Todo en orden!</h3>
            <p className="text-gray-600">
              No hay materiales con stock crítico o bajo. Tu inventario está bien abastecido.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}