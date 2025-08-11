// src/app/api/compras-materiales/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCognitoAuth } from '@/lib/auth/cognito-verify';

// GET - Generar PDF del recibo de compra
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyCognitoAuth(req);
    const { id } = await params;
    
    // Buscar la compra con todos los datos relacionados
    const compra = await prisma.compraMaterial.findUnique({
      where: { id },
      include: {
        material: true,
        proveedor: true,
        venta: {
          include: {
            cliente: true
          }
        },
        medioPago: true,
        user: {
          select: { name: true }
        }
      }
    });

    if (!compra) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 }
      );
    }

    // Generar HTML del recibo
    const htmlContent = generateReciboHTML(compra);
    
    // En un entorno real, aquí usarías una biblioteca como Puppeteer o Playwright
    // para generar el PDF. Por ahora, devolvemos el HTML
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="recibo-${compra.numero}.html"`
      }
    });
    
    // Para generar PDF real, descomenta el siguiente código:
    /*
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recibo-${compra.numero}.pdf"`
      }
    });
    */
    
  } catch (error: any) {
    console.error('Error al generar PDF de recibo:', error);
    
    if (error.message.includes('Token') || error.message.includes('autenticación')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al generar PDF de recibo' },
      { status: 500 }
    );
  }
}

function generateReciboHTML(compra: any): string {
  const fechaFormateada = new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(compra.fechaCompra));

  const fechaPagoFormateada = compra.fechaPago ? 
    new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(compra.fechaPago)) : 'Pendiente';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo de Compra - ${compra.numero}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #007bff;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header h2 {
            color: #6c757d;
            font-size: 18px;
            font-weight: normal;
        }
        
        .recibo-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .recibo-numero {
            background: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        
        .recibo-fecha {
            text-align: right;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: bold;
            color: #6c757d;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #212529;
            font-size: 14px;
        }
        
        .material-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        .totales {
            background: #e9ecef;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .total-row.final {
            border-top: 2px solid #007bff;
            padding-top: 15px;
            margin-top: 15px;
            font-weight: bold;
            font-size: 18px;
            color: #007bff;
        }
        
        .estado-pago {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .estado-pagado {
            background: #d4edda;
            color: #155724;
        }
        
        .estado-pendiente {
            background: #fff3cd;
            color: #856404;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
        }
        
        .obra-vinculada {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>AlumGestión</h1>
            <h2>Recibo de Compra de Material</h2>
        </div>
        
        <!-- Información del recibo -->
        <div class="recibo-info">
            <div class="recibo-numero">
                <div class="info-label">Número de Recibo</div>
                <div style="font-size: 20px; font-weight: bold; color: #007bff;">
                    ${compra.numero}
                </div>
            </div>
            <div class="recibo-fecha">
                <div class="info-label">Fecha de Compra</div>
                <div class="info-value">${fechaFormateada}</div>
            </div>
        </div>
        
        <!-- Información del proveedor -->
        <div class="section">
            <div class="section-title">Datos del Proveedor</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Nombre/Razón Social</div>
                    <div class="info-value">${compra.proveedor.nombre}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">CUIT</div>
                    <div class="info-value">${compra.cuitProveedor}</div>
                </div>
                ${compra.proveedor.email ? `
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${compra.proveedor.email}</div>
                </div>
                ` : ''}
                ${compra.proveedor.telefono ? `
                <div class="info-item">
                    <div class="info-label">Teléfono</div>
                    <div class="info-value">${compra.proveedor.telefono}</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Información de la factura -->
        <div class="section">
            <div class="section-title">Datos de la Factura</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Número de Factura</div>
                    <div class="info-value">${compra.numeroFactura}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha de Factura</div>
                    <div class="info-value">${fechaFormateada}</div>
                </div>
                ${compra.fechaVencimiento ? `
                <div class="info-item">
                    <div class="info-label">Fecha de Vencimiento</div>
                    <div class="info-value">${new Intl.DateTimeFormat('es-AR').format(new Date(compra.fechaVencimiento))}</div>
                </div>
                ` : ''}
                <div class="info-item">
                    <div class="info-label">Medio de Pago</div>
                    <div class="info-value">${compra.medioPago.nombre}</div>
                </div>
            </div>
        </div>
        
        <!-- Detalles del material -->
        <div class="section">
            <div class="section-title">Material Adquirido</div>
            <div class="material-details">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Código</div>
                        <div class="info-value">${compra.material.codigo}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Nombre</div>
                        <div class="info-value">${compra.material.nombre}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Cantidad</div>
                        <div class="info-value">${Number(compra.cantidad).toLocaleString()} ${compra.material.unidadMedida}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Precio Unitario</div>
                        <div class="info-value">$${Number(compra.precioUnitario).toLocaleString()} ${compra.moneda}</div>
                    </div>
                </div>
            </div>
        </div>
        
        ${compra.venta ? `
        <!-- Obra vinculada -->
        <div class="obra-vinculada">
            <div class="info-label">Material asignado a la obra</div>
            <div style="font-weight: bold; margin-top: 5px;">
                ${compra.venta.numero} - ${compra.venta.cliente.nombre}
            </div>
        </div>
        ` : ''}
        
        <!-- Totales -->
        <div class="totales">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>$${Number(compra.subtotal).toLocaleString()}</span>
            </div>
            <div class="total-row">
                <span>Impuestos:</span>
                <span>$${Number(compra.impuestos).toLocaleString()}</span>
            </div>
            <div class="total-row final">
                <span>TOTAL:</span>
                <span>$${Number(compra.total).toLocaleString()} ${compra.moneda}</span>
            </div>
        </div>
        
        <!-- Estado de pago -->
        <div class="section">
            <div class="section-title">Estado de Pago</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Estado</div>
                    <div class="info-value">
                        <span class="estado-pago estado-${compra.estadoPago.toLowerCase()}">
                            ${compra.estadoPago === 'PAGADO' ? 'Pagado' : 
                              compra.estadoPago === 'PENDIENTE' ? 'Pendiente' : 
                              compra.estadoPago}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fecha de Pago</div>
                    <div class="info-value">${fechaPagoFormateada}</div>
                </div>
            </div>
        </div>
        
        ${compra.observaciones ? `
        <!-- Observaciones -->
        <div class="section">
            <div class="section-title">Observaciones</div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 5px;">
                ${compra.observaciones}
            </div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
            <p>Documento generado automáticamente por AlumGestión</p>
            <p>Registrado por: ${compra.user.name} | Fecha de generación: ${new Date().toLocaleDateString('es-AR')}</p>
        </div>
    </div>
</body>
</html>`;
}