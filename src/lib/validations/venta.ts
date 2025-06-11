// ===================================

// src/lib/validations/venta.ts
import { z } from 'zod';

export const ventaSchema = z.object({
  clienteId: z.string()
    .uuid("ID de cliente inválido"),
  
  presupuestoId: z.string()
    .uuid("ID de presupuesto inválido")
    .optional(),
  
  fechaEntrega: z.date()
    .min(new Date(), "La fecha de entrega debe ser futura")
    .optional(),
  
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE'])
    .default('NORMAL'),
  
  descripcionObra: z.string()
    .min(1, "La descripción de la obra es requerida")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  
  observaciones: z.string()
    .max(1000, "Las observaciones no pueden exceder 1000 caracteres")
    .optional()
    .or(z.literal("")),
  
  condicionesPago: z.string()
    .max(500, "Las condiciones de pago no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  lugarEntrega: z.string()
    .max(200, "El lugar de entrega no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  
  descuento: z.number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100%")
    .optional()
    .default(0),
  
  impuestos: z.number()
    .min(0, "Los impuestos no pueden ser negativos")
    .max(100, "Los impuestos no pueden ser mayor a 100%")
    .optional()
    .default(0),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS')
});

export const ventaUpdateSchema = ventaSchema.partial();

export type VentaFormData = z.infer<typeof ventaSchema>;

