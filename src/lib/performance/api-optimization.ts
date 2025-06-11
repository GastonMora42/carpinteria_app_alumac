// src/lib/performance/api-optimization.ts
  /**
   * Optimizaciones para llamadas a la API
   */
  
  // Rate limiting para llamadas a la API
  const apiCallCounts = new Map<string, { count: number; resetTime: number }>();
  
  export function rateLimit(key: string, maxCalls: number = 100, windowMinutes: number = 1): boolean {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    const current = apiCallCounts.get(key);
    
    if (!current || now > current.resetTime) {
      apiCallCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.count >= maxCalls) {
      return false;
    }
    
    current.count++;
    return true;
  }
  
  // Batch de operaciones para reducir llamadas a la API
  export class BatchProcessor<T, R> {
    private queue: Array<{ data: T; resolve: (result: R) => void; reject: (error: Error) => void }> = [];
    private processor: (batch: T[]) => Promise<R[]>;
    private batchSize: number;
    private timeout: number;
    private timeoutId?: NodeJS.Timeout;
  
    constructor(
      processor: (batch: T[]) => Promise<R[]>,
      batchSize: number = 10,
      timeoutMs: number = 100
    ) {
      this.processor = processor;
      this.batchSize = batchSize;
      this.timeout = timeoutMs;
    }
  
    async add(data: T): Promise<R> {
      return new Promise((resolve, reject) => {
        this.queue.push({ data, resolve, reject });
        
        if (this.queue.length >= this.batchSize) {
          this.flush();
        } else if (!this.timeoutId) {
          this.timeoutId = setTimeout(() => this.flush(), this.timeout);
        }
      });
    }
  
    private async flush() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = undefined;
      }
  
      if (this.queue.length === 0) return;
  
      const batch = this.queue.splice(0);
      const batchData = batch.map(item => item.data);
  
      try {
        const results = await this.processor(batchData);
        batch.forEach((item, index) => {
          item.resolve(results[index]);
        });
      } catch (error) {
        batch.forEach(item => {
          item.reject(error as Error);
        });
      }
    }
  }
  
  // src/middleware/performance.ts
  /**
   * Middleware para optimización de performance
   */
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';
  
  export function performanceMiddleware(request: NextRequest) {
    const start = Date.now();
    
    // Headers de cache para recursos estáticos
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      
      // No cache para APIs dinámicas
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    }
  
    // Cache para recursos estáticos
    if (request.nextUrl.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return response;
    }
  
    return NextResponse.next();
  }
  
  // src/lib/performance/monitoring.ts
  /**
   * Sistema de monitoreo de performance
   */
  
  interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
  }
  
  class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private maxMetrics: number = 1000;
  
    startMeasure(name: string): () => void {
      const start = performance.now();
      
      return (metadata?: Record<string, any>) => {
        const duration = performance.now() - start;
        this.addMetric({
          name,
          duration,
          timestamp: Date.now(),
          metadata
        });
      };
    }
  
    addMetric(metric: PerformanceMetric): void {
      this.metrics.push(metric);
      
      // Limpiar métricas antiguas
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(-this.maxMetrics);
      }
  
      // Log en desarrollo
      if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
        console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
      }
    }
  
    getMetrics(name?: string): PerformanceMetric[] {
      return name 
        ? this.metrics.filter(m => m.name === name)
        : this.metrics;
    }
  
    getAverageTime(name: string): number {
      const relevantMetrics = this.getMetrics(name);
      if (relevantMetrics.length === 0) return 0;
      
      const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
      return total / relevantMetrics.length;
    }
  
    clearMetrics(): void {
      this.metrics = [];
    }
  }
  
  export const performanceMonitor = new PerformanceMonitor();
  
  // Hook para medir performance de componentes
  export function usePerformanceMonitor(name: string) {
    const endMeasure = performanceMonitor.startMeasure(name);
    
    return {
      endMeasure,
      getAverageTime: () => performanceMonitor.getAverageTime(name)
    };
  }