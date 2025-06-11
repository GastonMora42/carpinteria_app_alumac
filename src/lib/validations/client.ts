// src/lib/validations/client.ts
import { z } from 'zod';

export const clienteSchema = z.object({
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

export const clienteUpdateSchema = clienteSchema.partial();

export type ClienteFormData = z.infer<typeof clienteSchema>;
export type ClienteUpdateData = z.infer<typeof clienteUpdateSchema>;

