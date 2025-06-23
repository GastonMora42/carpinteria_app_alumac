// src/app/api/reportes/exportar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';
import { ExportUtils } from '@/lib/utils/exports';
import { DateUtils } from '@/lib/utils/calculations';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyCognitoAuth(req);
    
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const formato = searchParams.get('formato') || 'excel';
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const incluirDatosPersonales = searchParams.get('incluirDatosPersonales') === 'true';
    const incluirPrecios = searchParams.get('incluirPrecios') === 'true';
    
    console.log(`📤 Exportando: ${tipo} en formato ${formato}`);

    let data: any[] = [];
    let columns: any[] = [];
    let fileName = '';

    switch (tipo) {
      case 'clientes':
        const clientes = await prisma.cliente.findMany({
          where: {
            createdAt: fechaDesde && fechaHasta ? {
              gte: new Date(fechaDesde),
              lte: new Date(fechaHasta + 'T23:59:59')
            } : undefined
          },
          include: {
            _count: {
              select: {
                presupuestos: true,
                pedidos: true,
                transacciones: true
              }
            }
          },
          orderBy: { nombre: 'asc' }
        });

        data = clientes.map(cliente => ({
          'Código': cliente.codigo,
          'Nombre': cliente.nombre,
          'Email': incluirDatosPersonales ? cliente.email : '***',
          'Teléfono': incluirDatosPersonales ? cliente.telefono : '***',
          'Dirección': incluirDatosPersonales ? cliente.direccion : '***',
          'CUIT': incluirDatosPersonales ? cliente.cuit : '***',
          'Estado': cliente.activo ? 'Activo' : 'Inactivo',
          'Presupuestos': cliente._count.presupuestos,
          'Pedidos': cliente._count.pedidos,
          'Transacciones': cliente._count.transacciones,
          'Fecha Registro': DateUtils.formatDate(cliente.createdAt),
          'Notas': cliente.notas
        }));

        columns = [
          { key: 'Código', label: 'Código', width: 12 },
          { key: 'Nombre', label: 'Nombre', width: 25 },
          { key: 'Email', label: 'Email', width: 25 },
          { key: 'Teléfono', label: 'Teléfono', width: 15 },
          { key: 'Dirección', label: 'Dirección', width: 30 },
          { key: 'CUIT', label: 'CUIT', width: 15 },
          { key: 'Estado', label: 'Estado', width: 12 },
          { key: 'Presupuestos', label: 'Presupuestos', width: 12 },
          { key: 'Pedidos', label: 'Pedidos', width: 12 },
          { key: 'Transacciones', label: 'Transacciones', width: 12 },
          { key: 'Fecha Registro', label: 'Fecha Registro', width: 15 },
          { key: 'Notas', label: 'Notas', width: 40 }
        ];

        fileName = `Clientes-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`;
        break;

      case 'presupuestos':
        const presupuestos = await prisma.presupuesto.findMany({
          where: {
            fechaEmision: fechaDesde && fechaHasta ? {
              gte: new Date(fechaDesde),
              lte: new Date(fechaHasta + 'T23:59:59')
            } : undefined
          },
          include: {
            cliente: { select: { nombre: true } },
            user: { select: { name: true } },
            items: true
          },
          orderBy: { fechaEmision: 'desc' }
        });

        data = presupuestos.map(pres => ({
          'Número': pres.numero,
          'Cliente': pres.cliente.nombre,
          'Descripción Obra': pres.descripcionObra,
          'Estado': pres.estado,
          'Fecha Emisión': DateUtils.formatDate(pres.fechaEmision),
          'Fecha Validez': DateUtils.formatDate(pres.fechaValidez),
          'Subtotal': incluirPrecios ? Number(pres.subtotal) : 0,
          'Descuento': incluirPrecios ? Number(pres.descuento) || 0 : 0,
          'Impuestos': incluirPrecios ? Number(pres.impuestos) || 0 : 0,
          'Total': incluirPrecios ? Number(pres.total) : 0,
          'Moneda': pres.moneda,
          'Items': pres.items.length,
          'Condiciones Pago': pres.condicionesPago,
          'Tiempo Entrega': pres.tiempoEntrega,
          'Usuario': pres.user.name,
          'Observaciones': pres.observaciones
        }));

        columns = [
          { key: 'Número', label: 'Número', width: 15 },
          { key: 'Cliente', label: 'Cliente', width: 25 },
          { key: 'Descripción Obra', label: 'Descripción Obra', width: 35 },
          { key: 'Estado', label: 'Estado', width: 15 },
          { key: 'Fecha Emisión', label: 'F. Emisión', format: 'date', width: 12 },
          { key: 'Fecha Validez', label: 'F. Validez', format: 'date', width: 12 },
          { key: 'Subtotal', label: 'Subtotal', format: 'currency', width: 15 },
          { key: 'Descuento', label: 'Descuento', format: 'currency', width: 12 },
          { key: 'Impuestos', label: 'Impuestos', format: 'currency', width: 12 },
          { key: 'Total', label: 'Total', format: 'currency', width: 15 },
          { key: 'Moneda', label: 'Moneda', width: 10 },
          { key: 'Items', label: 'Items', width: 8 },
          { key: 'Condiciones Pago', label: 'Condiciones', width: 20 },
          { key: 'Tiempo Entrega', label: 'T. Entrega', width: 15 },
          { key: 'Usuario', label: 'Usuario', width: 15 },
          { key: 'Observaciones', label: 'Observaciones', width: 30 }
        ];

        fileName = `Presupuestos-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`;
        break;

      case 'ventas':
        const ventas = await prisma.pedido.findMany({
          where: {
            fechaPedido: fechaDesde && fechaHasta ? {
              gte: new Date(fechaDesde),
              lte: new Date(fechaHasta + 'T23:59:59')
            } : undefined
          },
          include: {
            cliente: { select: { nombre: true } },
            presupuesto: { select: { numero: true } },
            user: { select: { name: true } }
          },
          orderBy: { fechaPedido: 'desc' }
        });

        data = ventas.map(venta => ({
          'Número': venta.numero,
          'Cliente': venta.cliente.nombre,
          'Presupuesto': venta.presupuesto?.numero || '',
          'Estado': venta.estado,
          'Prioridad': venta.prioridad,
          'Fecha Pedido': DateUtils.formatDate(venta.fechaPedido),
          'Fecha Entrega': venta.fechaEntrega ? DateUtils.formatDate(venta.fechaEntrega) : '',
          'Fecha Real': venta.fechaEntregaReal ? DateUtils.formatDate(venta.fechaEntregaReal) : '',
          'Descripción': venta.descripcionObra,
          'Subtotal': incluirPrecios ? Number(venta.subtotal) : 0,
          'Total': incluirPrecios ? Number(venta.total) : 0,
          'Cobrado': incluirPrecios ? Number(venta.totalCobrado) : 0,
          'Saldo': incluirPrecios ? Number(venta.saldoPendiente) : 0,
          'Moneda': venta.moneda,
          'Avance %': Number(venta.porcentajeAvance) || 0,
          'Lugar Entrega': venta.lugarEntrega,
          'Usuario': venta.user.name,
          'Observaciones': venta.observaciones
        }));

        columns = [
          { key: 'Número', label: 'Número', width: 15 },
          { key: 'Cliente', label: 'Cliente', width: 25 },
          { key: 'Presupuesto', label: 'Presupuesto', width: 15 },
          { key: 'Estado', label: 'Estado', width: 15 },
          { key: 'Prioridad', label: 'Prioridad', width: 12 },
          { key: 'Fecha Pedido', label: 'F. Pedido', format: 'date', width: 12 },
          { key: 'Fecha Entrega', label: 'F. Entrega', format: 'date', width: 12 },
          { key: 'Fecha Real', label: 'F. Real', format: 'date', width: 12 },
          { key: 'Descripción', label: 'Descripción', width: 30 },
          { key: 'Subtotal', label: 'Subtotal', format: 'currency', width: 15 },
          { key: 'Total', label: 'Total', format: 'currency', width: 15 },
          { key: 'Cobrado', label: 'Cobrado', format: 'currency', width: 15 },
          { key: 'Saldo', label: 'Saldo', format: 'currency', width: 15 },
          { key: 'Moneda', label: 'Moneda', width: 10 },
          { key: 'Avance %', label: 'Avance %', width: 10 },
          { key: 'Lugar Entrega', label: 'Lugar', width: 20 },
          { key: 'Usuario', label: 'Usuario', width: 15 },
          { key: 'Observaciones', label: 'Observaciones', width: 30 }
        ];

        fileName = `Ventas-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`;
        break;

      case 'transacciones':
        const transacciones = await prisma.transaccion.findMany({
          where: {
            fecha: fechaDesde && fechaHasta ? {
              gte: new Date(fechaDesde),
              lte: new Date(fechaHasta + 'T23:59:59')
            } : undefined
          },
          include: {
            cliente: { select: { nombre: true } },
            proveedor: { select: { nombre: true } },
            pedido: { select: { numero: true } },
            medioPago: { select: { nombre: true } },
            user: { select: { name: true } }
          },
          orderBy: { fecha: 'desc' }
        });

        data = transacciones.map(trans => ({
          'Número': trans.numero,
          'Tipo': trans.tipo,
          'Concepto': trans.concepto,
          'Descripción': trans.descripcion,
          'Fecha': DateUtils.formatDate(trans.fecha),
          'Monto': incluirPrecios ? Number(trans.monto) : 0,
          'Moneda': trans.moneda,
          'Cliente': trans.cliente?.nombre || '',
          'Proveedor': trans.proveedor?.nombre || '',
          'Pedido': trans.pedido?.numero || '',
          'Medio Pago': trans.medioPago.nombre,
          'Comprobante': trans.numeroComprobante,
          'Tipo Comprobante': trans.tipoComprobante,
          'Vencimiento': trans.fechaVencimiento ? DateUtils.formatDate(trans.fechaVencimiento) : '',
          'Usuario': trans.user.name
        }));

        columns = [
          { key: 'Número', label: 'Número', width: 15 },
          { key: 'Tipo', label: 'Tipo', width: 15 },
          { key: 'Concepto', label: 'Concepto', width: 25 },
          { key: 'Descripción', label: 'Descripción', width: 30 },
          { key: 'Fecha', label: 'Fecha', format: 'date', width: 12 },
          { key: 'Monto', label: 'Monto', format: 'currency', width: 15 },
          { key: 'Moneda', label: 'Moneda', width: 10 },
          { key: 'Cliente', label: 'Cliente', width: 20 },
          { key: 'Proveedor', label: 'Proveedor', width: 20 },
          { key: 'Pedido', label: 'Pedido', width: 15 },
          { key: 'Medio Pago', label: 'Medio Pago', width: 15 },
          { key: 'Comprobante', label: 'Comprobante', width: 15 },
          { key: 'Tipo Comprobante', label: 'Tipo Comp.', width: 15 },
          { key: 'Vencimiento', label: 'Vencimiento', format: 'date', width: 12 },
          { key: 'Usuario', label: 'Usuario', width: 15 }
        ];

        fileName = `Transacciones-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`;
        break;

      case 'materiales':
        const materiales = await prisma.material.findMany({
          where: { activo: true },
          include: {
            proveedor: { select: { nombre: true } }
          },
          orderBy: { nombre: 'asc' }
        });

        data = materiales.map(material => ({
          'Código': material.codigo,
          'Nombre': material.nombre,
          'Descripción': material.descripcion,
          'Tipo': material.tipo,
          'Unidad': material.unidadMedida,
          'Precio': incluirPrecios ? Number(material.precioUnitario) : 0,
          'Moneda': material.moneda,
          'Stock Actual': Number(material.stockActual),
          'Stock Mínimo': Number(material.stockMinimo),
          'Proveedor': material.proveedor.nombre,
          'Estado': material.activo ? 'Activo' : 'Inactivo',
          'Fecha Registro': DateUtils.formatDate(material.createdAt)
        }));

        columns = [
          { key: 'Código', label: 'Código', width: 15 },
          { key: 'Nombre', label: 'Nombre', width: 25 },
          { key: 'Descripción', label: 'Descripción', width: 30 },
          { key: 'Tipo', label: 'Tipo', width: 15 },
          { key: 'Unidad', label: 'Unidad', width: 12 },
          { key: 'Precio', label: 'Precio', format: 'currency', width: 15 },
          { key: 'Moneda', label: 'Moneda', width: 10 },
          { key: 'Stock Actual', label: 'Stock Actual', format: 'number', width: 12 },
          { key: 'Stock Mínimo', label: 'Stock Mín.', format: 'number', width: 12 },
          { key: 'Proveedor', label: 'Proveedor', width: 20 },
          { key: 'Estado', label: 'Estado', width: 12 },
          { key: 'Fecha Registro', label: 'F. Registro', format: 'date', width: 12 }
        ];

        fileName = `Materiales-${DateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de exportación no válido' },
          { status: 400 }
        );
    }

    // Generar archivo según formato
    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (formato === 'excel') {
      // Crear workbook de Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Configurar anchos de columna
      if (columns.length > 0) {
        ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));
      }
      
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');
      fileBuffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
      
    } else if (formato === 'csv') {
      // Generar CSV
      const headers = columns.map(col => col.label).join(',');
      const rows = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      );
      const csvContent = [headers, ...rows].join('\n');
      
      fileBuffer = Buffer.from(csvContent, 'utf-8');
      contentType = 'text/csv';
      fileExtension = 'csv';
      
    } else {
      return NextResponse.json(
        { error: 'Formato no soportado' },
        { status: 400 }
      );
    }

    const finalFileName = `${fileName}.${fileExtension}`;
    
    console.log(`✅ Exportación completada: ${finalFileName} (${data.length} registros)`);

    // Registrar en historial (opcional)
    try {
      await prisma.exportHistory?.create({
        data: {
          type: tipo,
          format: formato,
          fileName: finalFileName,
          fileSize: fileBuffer.length,
          status: 'completed',
          userId: user.id
        }
      }).catch(() => {
        // Si la tabla no existe, ignorar
        console.log('Tabla de historial no encontrada, continuando...');
      });
    } catch (error) {
      // Ignorar errores de historial
    }

    // Retornar archivo
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error al exportar datos:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}