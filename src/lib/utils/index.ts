
// src/lib/utils/index.ts (función cn faltante)
import { type ClassValue, clsx } from 'clsx';

// Proporciona una implementación alternativa de twMerge si no está disponible
function twMergeFallback(classNames: string): string {
  // Esta función simplemente retorna las clases tal cual, sin hacer merge avanzado.
  // Puedes mejorarla según tus necesidades.
  return classNames;
}

export function cn(...inputs: ClassValue[]) {
  // Intenta usar twMerge si está disponible, si no, usa el fallback
  try {
    // @ts-ignore
    const { twMerge } = require('tailwind-merge') || {};
    return typeof twMerge === 'function'
      ? twMerge(clsx(inputs))
      : twMergeFallback(clsx(inputs));
  } catch {
    return twMergeFallback(clsx(inputs));
  }
}
