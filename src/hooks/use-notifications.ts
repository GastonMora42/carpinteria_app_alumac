// ===================================

// src/hooks/use-notifications.ts - ACTUALIZADO PARA CONSISTENCIA
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/utils/http';
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
    try {
      setLoading(true);
      console.log('🔔 Loading notifications...');
      
      // En el futuro, usar: const data = await api.get('/api/notifications');
      // Por ahora, simular carga de API
      setTimeout(() => {
        console.log('✅ Notifications loaded (mock data)');
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      console.error('❌ Error loading notifications:', err);
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      console.log('✅ Marking notification as read:', id);
      
      // En el futuro, usar: await api.put(`/api/notifications/${id}/read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('❌ Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      console.log('✅ Marking all notifications as read');
      
      // En el futuro, usar: await api.put('/api/notifications/mark-all-read');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('❌ Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Deleting notification:', id);
      
      // En el futuro, usar: await api.delete(`/api/notifications/${id}`);
      
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('❌ Error deleting notification:', err);
    }
  }, [notifications]);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      console.log('➕ Creating notification:', notification.title);
      
      // En el futuro, usar: const newNotification = await api.post('/api/notifications', notification);
      
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      return newNotification;
    } catch (err: any) {
      console.error('❌ Error creating notification:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    console.log('🔄 useNotifications effect triggered');
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

