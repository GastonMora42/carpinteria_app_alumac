// src/app/(auth)/reportes/exportar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/utils/http';
import { DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineDownload,
  HiOutlineDatabase,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineCollection,
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineCloudDownload,
  HiOutlineRefresh
} from 'react-icons/hi';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  formats: Array<'excel' | 'csv' | 'pdf'>;
  filters: string[];
  estimatedRows?: number;
  lastExport?: string;
}

interface ExportHistory {
  id: string;
  type: string;
  format: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  downloadUrl?: string;
  status: 'completed' | 'failed' | 'processing';
}

export default function ExportarDatosPage() {
  const [loading, setLoading] = useState(false);
  const [selectedExport, setSelectedExport] = useState<ExportOption | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [filters, setFilters] = useState({
    fechaDesde: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    formato: 'excel' as 'excel' | 'csv' | 'pdf',
    incluirDatosPersonales: false,
    incluirPrecios: true
  });

  const exportOptions: ExportOption[] = [
    {
      id: 'clientes',
      title: 'Base de Clientes',
      description: 'Exportar información completa de todos los clientes',
      icon: HiOutlineUsers,
      category: 'Clientes',
      formats: ['excel', 'csv'],
      filters: ['activos', 'inactivos', 'rango-fechas'],
      estimatedRows: 150
    },
    {
      id: 'presupuestos',
      title: 'Presupuestos',
      description: 'Listado de presupuestos con detalles y estados',
      icon: HiOutlineDocumentText,
      category: 'Ventas',
      formats: ['excel', 'csv', 'pdf'],
      filters: ['estado', 'cliente', 'rango-fechas'],
      estimatedRows: 450
    },
    {
      id: 'ventas',
      title: 'Ventas y Pedidos',
      description: 'Historial completo de ventas y pedidos',
      icon: HiOutlineClipboardCheck,
      category: 'Ventas',
      formats: ['excel', 'csv', 'pdf'],
      filters: ['estado', 'cliente', 'rango-fechas'],
      estimatedRows: 320
    },
    {
      id: 'transacciones',
      title: 'Transacciones Financieras',
      description: 'Movimientos de dinero, ingresos y egresos',
      icon: HiOutlineCash,
      category: 'Finanzas',
      formats: ['excel', 'csv'],
      filters: ['tipo', 'cliente', 'proveedor', 'rango-fechas'],
      estimatedRows: 1250
    },
    {
      id: 'materiales',
      title: 'Catálogo de Materiales',
      description: 'Inventario completo con precios y stock',
      icon: HiOutlineCollection,
      category: 'Inventario',
      formats: ['excel', 'csv'],
      filters: ['tipo', 'proveedor', 'stock-critico'],
      estimatedRows: 280
    },
    {
      id: 'movimientos-inventario',
      title: 'Movimientos de Inventario',
      description: 'Historial de entradas, salidas y ajustes',
      icon: HiOutlineDatabase,
      category: 'Inventario',
      formats: ['excel', 'csv'],
      filters: ['tipo', 'material', 'rango-fechas'],
      estimatedRows: 850
    },
    {
      id: 'analisis-financiero',
      title: 'Análisis Financiero Completo',
      description: 'Reporte ejecutivo con ratios y proyecciones',
      icon: HiOutlineCalendar,
      category: 'Reportes',
      formats: ['excel', 'pdf'],
      filters: ['rango-fechas', 'moneda'],
      estimatedRows: 0
    },
    {
      id: 'rendimiento-obras',
      title: 'Rendimiento por Obra',
      description: 'Análisis de rentabilidad y eficiencia de proyectos',
      icon: HiOutlineRefresh,
      category: 'Reportes',
      formats: ['excel', 'pdf'],
      filters: ['estado', 'cliente', 'rango-fechas'],
      estimatedRows: 180
    }
  ];

  const handleExport = async (exportOption: ExportOption) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        tipo: exportOption.id,
        formato: filters.formato,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        incluirDatosPersonales: filters.incluirDatosPersonales.toString(),
        incluirPrecios: filters.incluirPrecios.toString()
      });

      console.log(`📤 Iniciando exportación: ${exportOption.title} (${filters.formato})`);

      const response = await fetch(`/api/reportes/exportar?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al generar la exportación');
      }

      // Obtener el nombre del archivo del header
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${exportOption.id}-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}.${filters.formato === 'excel' ? 'xlsx' : filters.formato}`;

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`✅ Exportación completada: ${fileName}`);

      // Actualizar historial
      await fetchExportHistory();

      // Mostrar notificación de éxito
      alert(`Exportación completada: ${fileName}`);

    } catch (error: any) {
      console.error('Error en exportación:', error);
      alert(`Error al exportar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchExportHistory = async () => {
    try {
      const data = await api.get('/api/reportes/exportar/historial');
      setExportHistory(data.history || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  useEffect(() => {
    fetchExportHistory();
  }, []);

  const categories = [...new Set(exportOptions.map(option => option.category))];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exportar Datos</h1>
          <p className="text-gray-600">Descarga información del sistema en diferentes formatos</p>
        </div>
        <Button variant="outline" onClick={fetchExportHistory}>
          <HiOutlineRefresh className="h-4 w-4 mr-2" />
          Actualizar Historial
        </Button>
      </div>

      {/* Configuración Global */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Exportación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Fecha Desde"
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
            />

            <Input
              label="Fecha Hasta"
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
            />

            <Select
              label="Formato"
              value={filters.formato}
              onChange={(e) => setFilters(prev => ({ ...prev, formato: e.target.value as any }))}
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="pdf">PDF (.pdf)</option>
            </Select>

            <div className="space-y-3 pt-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="incluirPrecios"
                  checked={filters.incluirPrecios}
                  onChange={(e) => setFilters(prev => ({ ...prev, incluirPrecios: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="incluirPrecios" className="text-sm font-medium text-gray-700">
                  Incluir precios
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="incluirDatosPersonales"
                  checked={filters.incluirDatosPersonales}
                  onChange={(e) => setFilters(prev => ({ ...prev, incluirDatosPersonales: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="incluirDatosPersonales" className="text-sm font-medium text-gray-700">
                  Incluir datos sensibles
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opciones de Exportación por Categoría */}
      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportOptions
              .filter(option => option.category === category)
              .map(option => (
                <Card key={option.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <option.icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {option.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {option.description}
                        </p>
                        
                        {option.estimatedRows !== undefined && (
                          <div className="flex items-center text-xs text-gray-400 mb-3">
                            <HiOutlineDatabase className="h-3 w-3 mr-1" />
                            ~{option.estimatedRows.toLocaleString()} registros
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mb-3">
                          {option.formats.map(format => (
                            <span
                              key={format}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                filters.formato === format
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {format.toUpperCase()}
                            </span>
                          ))}
                        </div>

                        <Button
                          onClick={() => handleExport(option)}
                          disabled={loading || !option.formats.includes(filters.formato)}
                          className="w-full"
                          size="sm"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Exportando...
                            </>
                          ) : (
                            <>
                              <HiOutlineDownload className="h-4 w-4 mr-2" />
                              Exportar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Historial de Exportaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Exportaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {exportHistory.length === 0 ? (
            <div className="text-center py-8">
              <HiOutlineCloudDownload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin exportaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                No has realizado exportaciones recientemente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportHistory.map((export_item) => (
                <div
                  key={export_item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 ${
                      export_item.status === 'completed' ? 'text-green-600' :
                      export_item.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {export_item.status === 'completed' ? (
                        <HiOutlineCheckCircle className="h-5 w-5" />
                      ) : export_item.status === 'failed' ? (
                        <HiOutlineExclamationCircle className="h-5 w-5" />
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {export_item.fileName}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{export_item.type}</span>
                        <span>{export_item.format.toUpperCase()}</span>
                        <span>{formatFileSize(export_item.fileSize)}</span>
                        <span>{DateUtils.formatDateTime(export_item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {export_item.status === 'completed' && export_item.downloadUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(export_item.downloadUrl, '_blank')}
                    >
                      <HiOutlineDownload className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notas Importantes */}
      <Card>
        <CardContent className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <HiOutlineExclamationCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Notas Importantes</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Los archivos exportados contienen información sensible del negocio</li>
                    <li>Las exportaciones grandes pueden tardar varios minutos en procesarse</li>
                    <li>Los datos personales solo se incluyen si tienes permisos de administrador</li>
                    <li>Los archivos se mantienen disponibles por 30 días</li>
                    <li>Recomendamos usar Excel para mejor compatibilidad con gráficos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}