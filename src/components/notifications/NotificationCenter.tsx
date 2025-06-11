// src/components/notifications/NotificationCenter.tsx
'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { DateUtils } from '@/lib/utils/calculations';
import {
  HiOutlineBell,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineClock,
  HiOutlineChevronRight
} from 'react-icons/hi';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `h-5 w-5 ${
      priority === 'critical' ? 'text-red-500' :
      priority === 'high' ? 'text-yellow-500' :
      priority === 'medium' ? 'text-blue-500' :
      'text-gray-500'
    }`;

    switch (type) {
      case 'presupuesto_vence':
      case 'pedido_atraso':
        return <HiOutlineClock className={iconClass} />;
      case 'stock_minimo':
      case 'error_sistema':
        return <HiOutlineExclamationCircle className={iconClass} />;
      case 'pago_recibido':
      case 'meta_alcanzada':
        return <HiOutlineCheck className={iconClass} />;
      default:
        return <HiOutlineInformationCircle className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-yellow-500 bg-yellow-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-opacity-25" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HiOutlineBell className="h-6 w-6 text-gray-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Notificaciones
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      {unreadCount}
                    </span>
                  )}
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <HiOutlineX className="h-5 w-5" />
              </Button>
            </div>

            {/* Filtros */}
            <div className="mt-4 flex space-x-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                No leídas ({unreadCount})
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="ml-auto"
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <HiOutlineBell className="h-12 w-12 mb-4" />
                <p className="text-sm">
                  {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                      getPriorityColor(notification.priority)
                    } ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className={`mt-1 text-sm ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {DateUtils.formatDateTime(notification.createdAt)}
                            </span>
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-500"
                                onClick={onClose}
                              >
                                {notification.actionLabel}
                                <HiOutlineChevronRight className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <HiOutlineX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

