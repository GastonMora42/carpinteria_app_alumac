// src/lib/notifications/notificationService.ts
import { Notification, NotificationType, NotificationPriority } from './types';

export class NotificationService {
  private static instance: NotificationService;
  private subscribers: ((notification: Notification) => void)[] = [];

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  subscribe(callback: (notification: Notification) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    data?: Record<string, any>,
    actionUrl?: string,
    actionLabel?: string
  ) {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      priority,
      title,
      message,
      data,
      read: false,
      actionUrl,
      actionLabel,
      createdAt: new Date(),
      userId: 'current-user' // En producción obtener del contexto de auth
    };

    // Notificar a todos los suscriptores
    this.subscribers.forEach(callback => callback(notification));

    // En producción: también enviar a la API
    // await api.createNotification(notification);

    return notification;
  }

  // Métodos específicos para diferentes tipos de notificaciones
  async notifyPresupuestoVence(presupuestoId: string, numero: string, diasRestantes: number) {
    return this.createNotification(
      'presupuesto_vence',
      'Presupuesto por vencer',
      `El presupuesto ${numero} vence en ${diasRestantes} día(s)`,
      diasRestantes <= 1 ? 'critical' : 'high',
      { presupuestoId, numero, diasRestantes },
      `/presupuestos/${presupuestoId}`,
      'Ver presupuesto'
    );
  }

  async notifyPagoRecibido(clienteNombre: string, monto: number, moneda: string = 'PESOS') {
    return this.createNotification(
      'pago_recibido',
      'Pago recibido',
      `Se recibió un pago de ${monto.toLocaleString('es-AR', { 
        style: 'currency', 
        currency: moneda === 'PESOS' ? 'ARS' : 'USD' 
      })} de ${clienteNombre}`,
      'medium',
      { clienteNombre, monto, moneda },
      '/finanzas/transacciones',
      'Ver transacciones'
    );
  }

  async notifyStockMinimo(materialNombre: string, stockActual: number, stockMinimo: number) {
    return this.createNotification(
      'stock_minimo',
      'Stock mínimo alcanzado',
      `El material "${materialNombre}" está por debajo del stock mínimo (${stockActual}/${stockMinimo})`,
      'critical',
      { materialNombre, stockActual, stockMinimo },
      '/materiales',
      'Ver materiales'
    );
  }

  async notifyPedidoAtraso(pedidoNumero: string, diasAtraso: number) {
    return this.createNotification(
      'pedido_atraso',
      'Pedido con atraso',
      `El pedido ${pedidoNumero} tiene ${diasAtraso} día(s) de atraso en la entrega`,
      diasAtraso >= 5 ? 'critical' : 'high',
      { pedidoNumero, diasAtraso },
      '/ventas',
      'Ver pedidos'
    );
  }

  async notifyMetaAlcanzada(tipoMeta: string, meta: number, alcanzado: number) {
    return this.createNotification(
      'meta_alcanzada',
      'Meta alcanzada',
      `¡Felicitaciones! Has alcanzado la meta de ${tipoMeta} (${alcanzado.toLocaleString()}/${meta.toLocaleString()})`,
      'low',
      { tipoMeta, meta, alcanzado },
      '/dashboard',
      'Ver dashboard'
    );
  }
}

// Exportar instancia singleton
export const notificationService = NotificationService.getInstance();