// src/hooks/use-notifications.ts
import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationType, NotificationPriority } from '@/lib/notifications/types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mock notifications - en producción vendrían de API/WebSocket
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'presupuesto_vence',
      priority: 'high',
      title: 'Presupuesto por vencer',
      message: 'El presupuesto PRES-2024-001 vence mañana',
      data: { presupuestoId: 'pres-1', numero: 'PRES-2024-001' },
      read: false,
      actionUrl: '/presupuestos/pres-1',
      actionLabel: 'Ver presupuesto',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      userId: 'user-1'
    },
    {
      id: '2',
      type: 'pago_recibido',
      priority: 'medium',
      title: 'Pago recibido',
      message: 'Se recibió un pago de $50,000 de Constructora ABC',
      data: { clienteId: 'cli-1', monto: 50000 },
      read: false,
      actionUrl: '/finanzas/transacciones',
      actionLabel: 'Ver transacción',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      userId: 'user-1'
    }
  ];

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    // Simular carga de API
    setTimeout(() => {
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      setLoading(false);
    }, 1000);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    return newNotification;
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refresh: loadNotifications
  };
}