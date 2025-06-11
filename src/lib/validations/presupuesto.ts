// ===================================

// src/lib/validations/presupuesto.ts
import { z } from 'zod';

export const itemPresupuestoSchema = z.object({
  descripcion: z.string()
    .min(1, "La descripción es requerida")
    .max(200, "La descripción no puede exceder 200 caracteres"),
  
  detalle: z.string()
    .max(500, "El detalle no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  cantidad: z.number()
    .min(0.001, "La cantidad debe ser mayor a 0")
    .max(999999, "La cantidad es demasiado grande"),
  
  unidad: z.string()
    .min(1, "La unidad es requerida")
    .max(20, "La unidad no puede exceder 20 caracteres"),
  
  precioUnitario: z.number()
    .min(0.01, "El precio debe ser mayor a 0")
    .max(9999999.99, "El precio es demasiado alto"),
  
  descuento: z.number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100%")
    .optional()
    .default(0)
});

export const presupuestoSchema = z.object({
  clienteId: z.string()
    .uuid("ID de cliente inválido"),
  
  fechaValidez: z.date()
    .min(new Date(), "La fecha de validez debe ser futura"),
  
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
  
  tiempoEntrega: z.string()
    .max(100, "El tiempo de entrega no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  
  validezDias: z.number()
    .min(1, "La validez debe ser al menos 1 día")
    .max(365, "La validez no puede exceder 365 días")
    .default(30),
  
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
    .default('PESOS'),
  
  items: z.array(itemPresupuestoSchema)
    .min(1, "Debe incluir al menos un item")
});

export const presupuestoUpdateSchema = presupuestoSchema.partial();

export type PresupuestoFormData = z.infer<typeof presupuestoSchema>;
export type ItemPresupuestoFormData = z.infer<typeof itemPresupuestoSchema>;

