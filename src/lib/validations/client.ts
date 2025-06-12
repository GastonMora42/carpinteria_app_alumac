// src/lib/validations/client.ts
import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  cuit: z.string().optional(),
  notas: z.string().optional()
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

// src/lib/validations/transaccion.ts
export const transaccionSchema = z.object({
  tipo: z.enum(['INGRESO', 'EGRESO', 'ANTICIPO', 'PAGO_OBRA', 'PAGO_PROVEEDOR', 'GASTO_GENERAL', 'TRANSFERENCIA', 'AJUSTE']),
  concepto: z.string().min(1, "El concepto es requerido"),
  descripcion: z.string().optional(),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.enum(['PESOS', 'DOLARES']).default('PESOS'),
  cotizacion: z.number().optional(),
  fecha: z.date(),
  fechaVencimiento: z.date().optional(),
  numeroComprobante: z.string().optional(),
  tipoComprobante: z.string().optional(),
  clienteId: z.string().optional(),
  proveedorId: z.string().optional(),
  pedidoId: z.string().optional(),
  medioPagoId: z.string().min(1, "El medio de pago es requerido")
});

export type TransaccionFormData = z.infer<typeof transaccionSchema>;

// src/lib/validations/presupuesto.ts
export const itemPresupuestoSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida"),
  detalle: z.string().optional(),
  cantidad: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
  unidad: z.string().min(1, "La unidad es requerida"),
  precioUnitario: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  descuento: z.number().min(0).max(100).default(0)
});

export type ItemPresupuestoFormData = z.infer<typeof itemPresupuestoSchema>;

export const presupuestoSchema = z.object({
  clienteId: z.string().min(1, "El cliente es requerido"),
  fechaValidez: z.date(),
  descripcionObra: z.string().min(1, "La descripción de la obra es requerida"),
  observaciones: z.string().optional(),
  condicionesPago: z.string().optional(),
  tiempoEntrega: z.string().optional(),
  validezDias: z.number().min(1).default(30),
  descuento: z.number().min(0).max(100).default(0),
  impuestos: z.number().min(0).max(100).default(21),
  moneda: z.enum(['PESOS', 'DOLARES']).default('PESOS'),
  items: z.array(itemPresupuestoSchema).min(1, "Debe tener al menos un item")
});

export type PresupuestoFormData = z.infer<typeof presupuestoSchema>;

export const presupuestoUpdateSchema = presupuestoSchema.partial();

// src/lib/validations/venta.ts
export const ventaSchema = z.object({
  clienteId: z.string().min(1, "El cliente es requerido"),
  presupuestoId: z.string().optional(),
  fechaEntrega: z.date().optional(),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
  descripcionObra: z.string().optional(),
  observaciones: z.string().optional(),
  condicionesPago: z.string().optional(),
  lugarEntrega: z.string().optional(),
  descuento: z.number().min(0).max(100).default(0),
  impuestos: z.number().min(0).max(100).default(21),
  moneda: z.enum(['PESOS', 'DOLARES']).default('PESOS')
});

export type VentaFormData = z.infer<typeof ventaSchema>;

// src/lib/validations/material.ts
export const materialSchema = z.object({
  codigo: z.string().min(1, "El código es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  tipo: z.enum(['PERFIL', 'VIDRIO', 'ACCESORIO', 'HERRAMIENTAS', 'INSUMOS', 'OTRO']),
  unidadMedida: z.string().min(1, "La unidad de medida es requerida"),
  precioUnitario: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  moneda: z.enum(['PESOS', 'DOLARES']).default('PESOS'),
  stockActual: z.number().min(0).default(0),
  stockMinimo: z.number().min(0).default(0),
  proveedorId: z.string().min(1, "El proveedor es requerido")
});

export type MaterialFormData = z.infer<typeof materialSchema>;

export const proveedorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  cuit: z.string().optional(),
  notas: z.string().optional()
});

export type ProveedorFormData = z.infer<typeof proveedorSchema>;