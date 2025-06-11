// ===================================

// src/lib/validations/material.ts
import { z } from 'zod';

export const materialSchema = z.object({
  codigo: z.string()
    .min(1, "El código es requerido")
    .max(20, "El código no puede exceder 20 caracteres")
    .regex(/^[A-Z0-9\-_]+$/, "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos"),
  
  nombre: z.string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  
  descripcion: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  
  tipo: z.enum(['PERFIL', 'VIDRIO', 'ACCESORIO', 'HERRAMIENTAS', 'INSUMOS', 'OTRO']),
  
  unidadMedida: z.string()
    .min(1, "La unidad de medida es requerida")
    .max(20, "La unidad no puede exceder 20 caracteres"),
  
  precioUnitario: z.number()
    .min(0.01, "El precio debe ser mayor a 0")
    .max(9999999.99, "El precio es demasiado alto"),
  
  moneda: z.enum(['PESOS', 'DOLARES'])
    .default('PESOS'),
  
  stockActual: z.number()
    .min(0, "El stock no puede ser negativo")
    .optional()
    .default(0),
  
  stockMinimo: z.number()
    .min(0, "El stock mínimo no puede ser negativo")
    .optional()
    .default(0),
  
  proveedorId: z.string()
    .uuid("ID de proveedor inválido")
});

export const proveedorSchema = z.object({
  nombre: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  
  email: z.string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  
  telefono: z.string()
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(/^[+]?[0-9\s\-\(\)]+$/, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),
  
  direccion: z.string()
    .max(200, "La dirección no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  
  cuit: z.string()
    .regex(/^[0-9]{2}-[0-9]{8}-[0-9]$/, "Formato de CUIT inválido (XX-XXXXXXXX-X)")
    .optional()
    .or(z.literal("")),
  
  notas: z.string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal(""))
});

export type MaterialFormData = z.infer<typeof materialSchema>;
export type ProveedorFormData = z.infer<typeof proveedorSchema>;

