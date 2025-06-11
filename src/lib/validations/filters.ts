// ===================================

// src/lib/validations/filters.ts
import { z } from 'zod';

export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine((data) => data.startDate <= data.endDate, {
  message: "La fecha de inicio debe ser anterior a la fecha de fin",
  path: ["endDate"]
});

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const searchSchema = z.object({
  query: z.string().min(1, "El término de búsqueda es requerido").max(100)
});

export type DateRangeFilter = z.infer<typeof dateRangeSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchSchema>;