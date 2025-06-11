// ===================================

// src/lib/validations/transaccion.ts
import { z } from 'zod';

export const transaccionSchema = z.object({
  tipo: z.enum([
    'INGRESO',
    'EGRESO', 
    'ANTICIPO',
    'PAGO_OBRA',
    'PAGO_PROVEEDOR',
    'GASTO_GENERAL',
    'TRANSFERENCIA',
    'AJUSTE'
  ]),
  
  concepto: z.string()
    .min(1, "El concepto es requerido")
    .max(200, "El concepto no puede exceder 200 caracteres"),
  
  descripcion: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  monto: z.number()
    .min(0.01, "El monto debe ser mayor a 0")
    .max(99999999.99, "El monto es demasiado alto"),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS'),
  
  cotizacion: z.number()
    .min(0.01, "La cotización debe ser mayor a 0")
    .optional(),
  
  fecha: z.date()
    .max(new Date(), "La fecha no puede ser futura"),
  
  fechaVencimiento: z.date()
    .optional(),
  
  numeroComprobante: z.string()
    .max(50, "El número de comprobante no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  
  tipoComprobante: z.string()
    .max(50, "El tipo de comprobante no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  
  clienteId: z.string()
    .uuid("ID de cliente inválido")
    .optional(),
  
  proveedorId: z.string()
    .uuid("ID de proveedor inválido")
    .optional(),
  
  pedidoId: z.string()
    .uuid("ID de pedido inválido")
    .optional(),
  
  medioPagoId: z.string()
    .uuid("ID de medio de pago inválido")
});

export const chequeSchema = z.object({
  numero: z.string()
    .min(1, "El número de cheque es requerido")
    .max(20, "El número no puede exceder 20 caracteres"),
  
  banco: z.string()
    .min(1, "El banco es requerido")
    .max(100, "El banco no puede exceder 100 caracteres"),
  
  sucursal: z.string()
    .max(50, "La sucursal no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  
  cuit: z.string()
    .regex(/^[0-9]{2}-[0-9]{8}-[0-9]$/, "Formato de CUIT inválido")
    .optional()
    .or(z.literal("")),
  
  fechaEmision: z.date(),
  
  fechaVencimiento: z.date()
    .min(new Date(), "La fecha de vencimiento debe ser futura"),
  
  monto: z.number()
    .min(0.01, "El monto debe ser mayor a 0")
    .max(99999999.99, "El monto es demasiado alto"),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS'),
  
  clienteId: z.string()
    .uuid("ID de cliente inválido")
    .optional()
});

export type TransaccionFormData = z.infer<typeof transaccionSchema>;
export type ChequeFormData = z.infer<typeof chequeSchema>;

