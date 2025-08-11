// src/lib/validations/compra-material.ts
import { z } from 'zod';

// Helper para transformar strings de fecha a Date objects
const dateTransform = z.string().or(z.date()).transform((value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida');
    }
    return date;
  }
  throw new Error('Formato de fecha inválido');
});

export const compraMaterialSchema = z.object({
  // Datos del material
  materialId: z.string()
    .uuid("ID de material inválido"),
  
  proveedorId: z.string()
    .uuid("ID de proveedor inválido"),
  
  ventaId: z.string()
    .uuid("ID de venta inválido")
    .optional(),
  
  // Cantidades y precios
  cantidad: z.number()
    .min(0.001, "La cantidad debe ser mayor a 0")
    .max(999999, "La cantidad es demasiado grande"),
  
  precioUnitario: z.number()
    .min(0.01, "El precio debe ser mayor a 0")
    .max(9999999.99, "El precio es demasiado alto"),
  
  impuestos: z.number()
    .min(0, "Los impuestos no pueden ser negativos")
    .max(100, "Los impuestos no pueden ser mayor a 100%")
    .optional()
    .default(0),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS'),
  
  // Datos de la factura
  numeroFactura: z.string()
    .min(1, "El número de factura es requerido")
    .max(50, "El número de factura no puede exceder 50 caracteres"),
  
  cuitProveedor: z.string()
    .regex(/^[0-9]{2}-[0-9]{8}-[0-9]$/, "Formato de CUIT inválido (XX-XXXXXXXX-X)"),
  
  // Fechas
  fechaCompra: dateTransform,
  
  fechaPago: dateTransform.optional(),
  
  fechaVencimiento: dateTransform.optional(),
  
  // Medio de pago
  medioPagoId: z.string()
    .uuid("Medio de pago inválido"),
  
  // Estado del pago
  estadoPago: z.enum(['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO'])
    .default('PENDIENTE'),
  
  // Observaciones
  observaciones: z.string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  // Archivos (URLs)
  archivoFactura: z.string()
    .url("URL de archivo inválida")
    .optional(),
});

export const compraMaterialUpdateSchema = compraMaterialSchema.partial();

export type CompraMaterialFormData = z.infer<typeof compraMaterialSchema>;
export type CompraMaterialUpdateData = z.infer<typeof compraMaterialUpdateSchema>;

// Constantes para estados de pago
export const ESTADOS_PAGO = {
  PENDIENTE: { 
    label: 'Pendiente', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳'
  },
  PAGADO: { 
    label: 'Pagado', 
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  VENCIDO: { 
    label: 'Vencido', 
    color: 'bg-red-100 text-red-800',
    icon: '⚠️'
  },
  CANCELADO: { 
    label: 'Cancelado', 
    color: 'bg-gray-100 text-gray-800',
    icon: '❌'
  }
} as const;