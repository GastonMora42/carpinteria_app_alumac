// src/lib/notifications/types.ts
export type NotificationType = 
  | 'presupuesto_vence'
  | 'pedido_atraso'
  | 'pago_recibido'
  | 'stock_minimo'
  | 'cheque_vence'
  | 'tarea_pendiente'
  | 'meta_alcanzada'
  | 'error_sistema'
  | 'recordatorio';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  expiresAt?: Date;
  userId: string;
}