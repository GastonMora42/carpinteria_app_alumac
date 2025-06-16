// src/app/(auth)/ventas/estados/page.tsx
'use client';

import { useState } from 'react';
import { useVentas } from '@/hooks/use-ventas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Currency, CurrencyUtils, DateUtils } from '@/lib/utils/calculations';
import { ESTADOS_PEDIDO } from '@/lib/utils/validators';
import Link from 'next/link';
import {
  HiOutlineEye,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle
} from 'react-icons/hi';

const ESTADO_GROUPS = [
  {
    title: 'Pendientes de Producción',
    estados: ['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO'],
    color: 'bg-yellow-50 border-yellow-200',
    icon: HiOutlineClock,
    iconColor: 'text-yellow-600'
  },
  {
    title: 'En Producción',
    estados: ['EN_PRODUCCION'],
    color: 'bg-blue-50 border-blue-200',
    icon: HiOutlineClipboardCheck,
    iconColor: 'text-blue-600'
  },
  {
    title: 'Listos para Entrega',
    estados: ['LISTO_ENTREGA'],
    color: 'bg-green-50 border-green-200',
    icon: HiOutlineCheckCircle,
    iconColor: 'text-green-600'
  },
  {
    title: 'Entregados',
    estados: ['ENTREGADO', 'FACTURADO'],
    color: 'bg-purple-50 border-purple-200',
    icon: HiOutlineTruck,
    iconColor: 'text-purple-600'
  },
  {
    title: 'Finalizados',
    estados: ['COBRADO'],
    color: 'bg-emerald-50 border-emerald-200',
    icon: HiOutlineCash,
    iconColor: 'text-emerald-600'
  },
  {
    title: 'Cancelados',
    estados: ['CANCELADO'],
    color: 'bg-red-50 border-red-200',
    icon: HiOutlineXCircle,
    iconColor: 'text-red-600'
  }
];

export default function VentasEstadosPage() {
  const [selectedGroup, setSelectedGroup] = useState(ESTADO_GROUPS[0]);
  
  const { ventas, loading, error } = useVentas({
    estado: selectedGroup.estados.length === 1 ? selectedGroup.estados[0] : undefined
  });

  // Filtrar ventas por estados del grupo seleccionado
  const filteredVentas = selectedGroup.estados.length > 1 
    ? ventas.filter(venta => selectedGroup.estados.includes(venta.estado))
    : ventas;

  // Calcular estadísticas por estado
  const estadisticasPorEstado = Object.entries(ESTADOS_PEDIDO).map(([key, value]) => {
    const count = ventas.filter(v => v.estado === key).length;
    const total = ventas.filter(v => v.estado === key).reduce((acc, v) => acc + Number(v.total), 0);
    return {
      estado: key,
      label: value.label,
      color: value.color,
      count,
      total
    };
  }).filter(stat => stat.count > 0);

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'EN_PROCESO':
      case 'EN_PRODUCCION':
        return <HiOutlineClock className="h-4 w-4" />;
      case 'LISTO_ENTREGA':
        return <HiOutlineCheckCircle className="h-4 w-4" />;
      case 'ENTREGADO':
        return <HiOutlineTruck className="h-4 w-4" />;
      case 'COBRADO':
        return <HiOutlineCash className="h-4 w-4" />;
      case 'CANCELADO':
        return <HiOutlineXCircle className="h-4 w-4" />;
      default:
        return <HiOutlineClipboardCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas por Estado</h1>
          <p className="text-gray-600">Organiza las ventas según su estado de progreso</p>
        </div>
        <Link href="/ventas/nueva">
          <Button>
            Nueva Venta
          </Button>
        </Link>
      </div>

      {/* Resumen general por estados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {estadisticasPorEstado.map((stat) => (
          <Card key={stat.estado} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getEstadoIcon(stat.estado)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.count} ventas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-sm font-medium text-gray-900">
                    {CurrencyUtils.formatAmount(stat.total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros por grupos de estados */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Grupo de Estados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ESTADO_GROUPS.map((group) => (
              <Button
                key={group.title}
                variant={selectedGroup.title === group.title ? "primary" : "outline"}
                onClick={() => setSelectedGroup(group)}
                className="justify-start"
              >
                <group.icon className={`h-4 w-4 mr-2 ${group.iconColor}`} />
                {group.title}
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {ventas.filter(v => group.estados.includes(v.estado)).length}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de ventas del grupo seleccionado */}
      <Card className={selectedGroup.color}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <selectedGroup.icon className={`h-5 w-5 mr-2 ${selectedGroup.iconColor}`} />
              {selectedGroup.title}
            </CardTitle>
            <span className="text-sm text-gray-600">
              {filteredVentas.length} venta(s)
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredVentas.length === 0 ? (
            <div className="text-center py-12">
              <selectedGroup.icon className={`mx-auto h-12 w-12 ${selectedGroup.iconColor} mb-4`} />
              <h3 className="text-sm font-medium text-gray-900">No hay ventas en este estado</h3>
              <p className="text-sm text-gray-500 mt-1">
                Las ventas en estado "{selectedGroup.title}" aparecerán aquí
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Pedido</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Estado Específico</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                  <TableHeaderCell>Acciones</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVentas.map((venta) => {
                  const estadoInfo = ESTADOS_PEDIDO[venta.estado as keyof typeof ESTADOS_PEDIDO];
                  
                  return (
                    <TableRow key={venta.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{venta.numero}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {venta.descripcionObra}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{venta.cliente.nombre}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          estadoInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                          estadoInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          estadoInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          estadoInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                          estadoInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getEstadoIcon(venta.estado)}
                          <span className="ml-1">{estadoInfo.label}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {CurrencyUtils.formatAmount(venta.total, venta.moneda as Currency)}
                          </div>
                          {venta.saldoPendiente > 0 && (
                            <div className="text-sm text-red-600">
                              Saldo: {CurrencyUtils.formatAmount(venta.saldoPendiente, venta.moneda as Currency)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-gray-900">
                            {DateUtils.formatDate(venta.fechaPedido)}
                          </div>
                          {venta.fechaEntrega && (
                            <div className="text-xs text-gray-500">
                              Entrega: {DateUtils.formatDate(venta.fechaEntrega)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/ventas/${venta.id}`}>
                            <Button variant="ghost" size="sm">
                              <HiOutlineEye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {venta.saldoPendiente > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <HiOutlineCash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}