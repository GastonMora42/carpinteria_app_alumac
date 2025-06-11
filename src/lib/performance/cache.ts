// src/lib/performance/cache.ts
/**
 * Sistema de cache para optimizar consultas frecuentes
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
  }
  
  class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();
    private maxSize: number;
  
    constructor(maxSize: number = 100) {
      this.maxSize = maxSize;
    }
  
    set<T>(key: string, data: T, ttlMinutes: number = 5): void {
      // Limpiar cache si está lleno
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }
  
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000
      });
    }
  
    get<T>(key: string): T | null {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return null;
      }
  
      // Verificar si expiró
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        return null;
      }
  
      return entry.data as T;
    }
  
    invalidate(pattern?: string): void {
      if (pattern) {
        for (const key of this.cache.keys()) {
          if (key.includes(pattern)) {
            this.cache.delete(key);
          }
        }
      } else {
        this.cache.clear();
      }
    }
  }
  
  export const cache = new MemoryCache();
  
  