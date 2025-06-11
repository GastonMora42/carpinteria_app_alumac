  // ===================================
  
  // src/lib/utils/exports.ts
  import * as XLSX from 'xlsx';
import { CurrencyUtils, DateUtils } from './calculations';
  
  export interface ExportColumn {
    key: string;
    label: string;
    width?: number;
    format?: 'currency' | 'date' | 'number' | 'text';
  }
  
  export class ExportUtils {
    /**
     * Exporta datos a Excel
     */
    static async exportToExcel<T extends Record<string, any>>(
      data: T[],
      columns: ExportColumn[],
      filename: string,
      sheetName: string = 'Datos'
    ): Promise<void> {
      try {
        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // Preparar datos con headers
        const headers = columns.map(col => col.label);
        const rows = data.map(item => 
          columns.map(col => this.formatCellValue(item[col.key], col.format))
        );
        
        const wsData = [headers, ...rows];
        
        // Crear worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Configurar anchos de columna
        const colWidths = columns.map(col => ({ wch: col.width || 15 }));
        ws['!cols'] = colWidths;
        
        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Descargar archivo
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        throw new Error('Error al generar archivo Excel');
      }
    }
  
    /**
     * Exporta datos a CSV
     */
    static exportToCSV<T extends Record<string, any>>(
      data: T[],
      columns: ExportColumn[],
      filename: string
    ): void {
      try {
        const headers = columns.map(col => col.label);
        const csvContent = [
          headers.join(','),
          ...data.map(item => 
            columns.map(col => {
              const value = this.formatCellValue(item[col.key], col.format);
              // Escapar comillas y comas
              return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
          )
        ].join('\n');
  
        // Crear y descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
      } catch (error) {
        console.error('Error al exportar a CSV:', error);
        throw new Error('Error al generar archivo CSV');
      }
    }
  
    /**
     * Formatea valores de celdas según el tipo
     */
    private static formatCellValue(value: any, format?: string): string {
      if (value === null || value === undefined) return '';
      
      switch (format) {
        case 'currency':
          return CurrencyUtils.formatNumber(Number(value));
        case 'date':
          return DateUtils.formatDate(value);
        case 'number':
          return Number(value).toLocaleString('es-AR');
        default:
          return String(value);
      }
    }
  
    /**
     * Genera PDF básico (requiere biblioteca adicional como jsPDF)
     */
    static async exportToPDF(
      data: any,
      title: string,
      filename: string
    ): Promise<void> {
      // Esta función requiere jsPDF - implementar cuando se añada la dependencia
      console.log('PDF export not implemented yet');
      throw new Error('Exportación a PDF no implementada aún');
    }
  }
  
  