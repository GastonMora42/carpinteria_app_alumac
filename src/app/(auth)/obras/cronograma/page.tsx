// src/app/(auth)/obras/cronograma/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useVentas } from '@/hooks/use-ventas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineChartBar
} from 'react-icons/hi';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ObraTimeline {
  id: string;
  numero: string;
  cliente: string;
  descripcion: string;
  fechaInicio: Date;
  fechaEntrega?: Date;
  fechaEntregaReal?: Date;
  diasRestantes: number;
  diasTranscurridos: number;
  diasTotales: number;
  porcentajeAvance: number;
  porcentajeTiempo: number;
  estado: string;
  prioridad: string;
  total: number;
  saldoPendiente: number;
  alertas: {
    atrasada: boolean;
    proximaVencer: boolean;
    sinFechaEntrega: boolean;
    sinAvance: boolean;
  };
  eficiencia: 'adelantado' | 'a_tiempo' | 'atrasado' | 'sin_datos';
}

export default function ObrasTimelinePage() {
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroEficiencia, setFiltroEficiencia] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<'fechaEntrega' | 'porcentaje' | 'prioridad' | 'estado'>('fechaEntrega');
  const [mostrarSoloAlertas, setMostrarSoloAlertas] = useState(false);

  const { ventas, loading, error, refetch } = useVentas({ 
    limit: 100,
    estado: filtroEstado || undefined 
  });

  // Procesar datos para el timeline
  const obrasTimeline = useMemo((): ObraTimeline[] => {
    return ventas.map(venta => {
      const fechaInicio = new Date(venta.fechaPedido);
      // Ajuste: fechaEntrega y fechaEntregaReal deben ser undefined si no existen, no null
      const fechaEntrega = venta.fechaEntrega ? new Date(venta.fechaEntrega) : undefined;
      const fechaEntregaReal = venta.fechaEntregaReal ? new Date(venta.fechaEntregaReal) : undefined;
      const hoy = new Date();

      // Calcular días
      let diasTotales = 0;
      let diasTranscurridos = 0;
      let diasRestantes = 0;
      let porcentajeTiempo = 0;

      if (fechaEntrega) {
        diasTotales = Math.max(1, Math.ceil((fechaEntrega.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)));
        diasTranscurridos = Math.max(0, Math.ceil((hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)));
        diasRestantes = Math.ceil((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        porcentajeTiempo = Math.min(100, (diasTranscurridos / diasTotales) * 100);
      }

      // Determinar alertas
      const alertas = {
        atrasada: fechaEntrega ? diasRestantes < 0 : false,
        proximaVencer: fechaEntrega ? diasRestantes >= 0 && diasRestantes <= 3 : false,
        sinFechaEntrega: !fechaEntrega,
        sinAvance: venta.porcentajeAvance === 0 && diasTranscurridos > 3
      };

      // Determinar eficiencia
      let eficiencia: 'adelantado' | 'a_tiempo' | 'atrasado' | 'sin_datos' = 'sin_datos';
      
      if (fechaEntrega && venta.porcentajeAvance > 0) {
        if (venta.porcentajeAvance >= porcentajeTiempo + 10) {
          eficiencia = 'adelantado';
        } else if (venta.porcentajeAvance >= porcentajeTiempo - 10) {
          eficiencia = 'a_tiempo';
        } else {
          eficiencia = 'atrasado';
        }
      }

      return {
        id: venta.id,
        numero: venta.numero,
        cliente: venta.cliente.nombre,
        descripcion: venta.descripcionObra || 'Sin descripción',
        fechaInicio,
        fechaEntrega,
        fechaEntregaReal,
        diasRestantes,
        diasTranscurridos,
        diasTotales,
        porcentajeAvance: venta.porcentajeAvance,
        porcentajeTiempo,
        estado: venta.estado,
        prioridad: venta.prioridad,
        total: venta.total,
        saldoPendiente: venta.saldoPendiente,
        alertas,
        eficiencia
      };
    });
  }, [ventas]);

  // Filtrar obras
  const obrasFiltradas = useMemo(() => {
    let filtradas = obrasTimeline;

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      filtradas = filtradas.filter(obra => 
        obra.numero.toLowerCase().includes(termino) ||
        obra.cliente.toLowerCase().includes(termino) ||
        obra.descripcion.toLowerCase().includes(termino)
      );
    }

    // Filtro por prioridad
    if (filtroPrioridad) {
      filtradas = filtradas.filter(obra => obra.prioridad === filtroPrioridad);
    }

    // Filtro por eficiencia
    if (filtroEficiencia) {
      filtradas = filtradas.filter(obra => obra.eficiencia === filtroEficiencia);
    }

    // Filtro solo alertas
    if (mostrarSoloAlertas) {
      filtradas = filtradas.filter(obra => 
        Object.values(obra.alertas).some(alerta => alerta)
      );
    }

    // Ordenar
    filtradas.sort((a, b) => {
      switch (ordenarPor) {
        case 'fechaEntrega':
          if (!a.fechaEntrega && !b.fechaEntrega) return 0;
          if (!a.fechaEntrega) return 1;
          if (!b.fechaEntrega) return -1;
          return a.fechaEntrega.getTime() - b.fechaEntrega.getTime();
        
        case 'porcentaje':
          return b.porcentajeAvance - a.porcentajeAvance;
        
        case 'prioridad':
          const prioridadOrden = { 'URGENTE': 0, 'ALTA': 1, 'NORMAL': 2, 'BAJA': 3 };
          return prioridadOrden[a.prioridad as keyof typeof prioridadOrden] - 
                 prioridadOrden[b.prioridad as keyof typeof prioridadOrden];
        
        case 'estado':
          return a.estado.localeCompare(b.estado);
        
        default:
          return 0;
      }
    });

    return filtradas;
  }, [obrasTimeline, busqueda, filtroPrioridad, filtroEficiencia, mostrarSoloAlertas, ordenarPor]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = obrasTimeline.length;
    const atrasadas = obrasTimeline.filter(o => o.alertas.atrasada).length;
    const proximasVencer = obrasTimeline.filter(o => o.alertas.proximaVencer).length;
    const adelantadas = obrasTimeline.filter(o => o.eficiencia === 'adelantado').length;
    const sinFechaEntrega = obrasTimeline.filter(o => o.alertas.sinFechaEntrega).length;
    
    return { total, atrasadas, proximasVencer, adelantadas, sinFechaEntrega };
  }, [obrasTimeline]);

  const getEstadoColor = (estado: string) => {
    const colores = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'CONFIRMADO': 'bg-blue-100 text-blue-800',
      'EN_PROCESO': 'bg-indigo-100 text-indigo-800',
      'EN_PRODUCCION': 'bg-purple-100 text-purple-800',
      'LISTO_ENTREGA': 'bg-green-100 text-green-800',
      'ENTREGADO': 'bg-emerald-100 text-emerald-800',
      'FACTURADO': 'bg-teal-100 text-teal-800',
      'COBRADO': 'bg-green-100 text-green-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadColor = (prioridad: string) => {
    const colores = {
      'BAJA': 'bg-gray-100 text-gray-800',
      'NORMAL': 'bg-blue-100 text-blue-800',
      'ALTA': 'bg-orange-100 text-orange-800',
      'URGENTE': 'bg-red-100 text-red-800'
    };
    return colores[prioridad as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getEficienciaColor = (eficiencia: string) => {
    const colores = {
      'adelantado': 'bg-green-100 text-green-800',
      'a_tiempo': 'bg-blue-100 text-blue-800',
      'atrasado': 'bg-red-100 text-red-800',
      'sin_datos': 'bg-gray-100 text-gray-800'
    };
    return colores[eficiencia as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getProgressBarColor = (obra: ObraTimeline) => {
    if (obra.alertas.atrasada) return 'bg-red-500';
    if (obra.alertas.proximaVencer) return 'bg-yellow-500';
    if (obra.eficiencia === 'adelantado') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronograma de Obras</h1>
          <p className="text-gray-600">Seguimiento del progreso y plazos de entrega</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineChartBar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Obras</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineExclamationCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.atrasadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineClock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Próximas a Vencer</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.proximasVencer}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Adelantadas</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.adelantadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <HiOutlineCalendar className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sin Fecha</p>
                <p className="text-2xl font-bold text-gray-600">{estadisticas.sinFechaEntrega}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <Input
                placeholder="Número, cliente, descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <Select
              label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="EN_PRODUCCION">En Producción</option>
              <option value="LISTO_ENTREGA">Listo para Entrega</option>
              <option value="ENTREGADO">Entregado</option>
            </Select>

            <Select
              label="Prioridad"
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
            >
              <option value="">Todas las prioridades</option>
              <option value="URGENTE">Urgente</option>
              <option value="ALTA">Alta</option>
              <option value="NORMAL">Normal</option>
              <option value="BAJA">Baja</option>
            </Select>

            <Select
              label="Eficiencia"
              value={filtroEficiencia}
              onChange={(e) => setFiltroEficiencia(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="adelantado">Adelantado</option>
              <option value="a_tiempo">A Tiempo</option>
              <option value="atrasado">Atrasado</option>
              <option value="sin_datos">Sin Datos</option>
            </Select>

            <Select
              label="Ordenar por"
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value as any)}
            >
              <option value="fechaEntrega">Fecha de Entrega</option>
              <option value="porcentaje">% Avance</option>
              <option value="prioridad">Prioridad</option>
              <option value="estado">Estado</option>
            </Select>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={mostrarSoloAlertas}
                  onChange={(e) => setMostrarSoloAlertas(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Solo alertas</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de obras */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar obras</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </CardContent>
        </Card>
      ) : obrasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <HiOutlineCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay obras para mostrar</h3>
            <p className="mt-1 text-sm text-gray-500">
              {busqueda || filtroEstado || filtroPrioridad || filtroEficiencia || mostrarSoloAlertas
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'No tienes obras registradas'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {obrasFiltradas.map((obra) => (
            <Card key={obra.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {obra.numero}
                        </h3>
                        <Badge className={getPrioridadColor(obra.prioridad)}>
                          {obra.prioridad}
                        </Badge>
                        <Badge className={getEstadoColor(obra.estado)}>
                          {obra.estado.replace('_', ' ')}
                        </Badge>
                        <Badge className={getEficienciaColor(obra.eficiencia)}>
                          {obra.eficiencia === 'adelantado' ? 'Adelantado' :
                           obra.eficiencia === 'a_tiempo' ? 'A Tiempo' :
                           obra.eficiencia === 'atrasado' ? 'Atrasado' : 'Sin Datos'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{obra.cliente}</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-2xl truncate">
                        {obra.descripcion}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Alertas */}
                      {Object.values(obra.alertas).some(alerta => alerta) && (
                        <div className="flex space-x-1">
                          {obra.alertas.atrasada && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Atrasada
                            </span>
                          )}
                          {obra.alertas.proximaVencer && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Próxima a vencer
                            </span>
                          )}
                          {obra.alertas.sinFechaEntrega && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Sin fecha
                            </span>
                          )}
                          {obra.alertas.sinAvance && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Sin avance
                            </span>
                          )}
                        </div>
                      )}

                      <Link href={`/ventas/${obra.id}`}>
                        <Button variant="ghost" size="sm">
                          <HiOutlineEye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Información de fechas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Inicio:</span>
                      <p className="text-gray-900">{DateUtils.formatDate(obra.fechaInicio)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Entrega programada:</span>
                      <p className={`font-medium ${
                        obra.alertas.atrasada ? 'text-red-600' :
                        obra.alertas.proximaVencer ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {obra.fechaEntrega ? DateUtils.formatDate(obra.fechaEntrega) : 'No definida'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Días restantes:</span>
                      <p className={`font-bold ${
                        obra.diasRestantes < 0 ? 'text-red-600' :
                        obra.diasRestantes <= 3 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {obra.fechaEntrega ? 
                          (obra.diasRestantes < 0 ? 
                            `${Math.abs(obra.diasRestantes)} días de retraso` :
                            `${obra.diasRestantes} días`
                          ) : 
                          'Sin fecha definida'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Barras de progreso */}
                  <div className="space-y-3">
                    {/* Progreso del trabajo */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Avance del trabajo</span>
                        <span className="text-sm font-bold text-gray-900">{obra.porcentajeAvance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(obra)}`}
                          style={{ width: `${Math.min(100, obra.porcentajeAvance)}%` }}
                        />
                      </div>
                    </div>

                    {/* Progreso del tiempo */}
                    {obra.fechaEntrega && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Tiempo transcurrido</span>
                          <span className="text-sm font-bold text-gray-900">
                            {Math.min(100, obra.porcentajeTiempo).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, obra.porcentajeTiempo)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Información financiera */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-3 border-t border-gray-200">
                    <div>
                      <span className="font-medium text-gray-700">Total obra:</span>
                      <p className="text-lg font-bold text-gray-900">
                        ${obra.total.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Saldo pendiente:</span>
                      <p className={`text-lg font-bold ${
                        obra.saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${obra.saldoPendiente.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">% Cobrado:</span>
                      <p className="text-lg font-bold text-blue-600">
                        {obra.total > 0 ? (((obra.total - obra.saldoPendiente) / obra.total) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}