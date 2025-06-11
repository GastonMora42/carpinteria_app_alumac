
// ===================================

// src/components/layouts/Header.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HiOutlineBell, 
  HiOutlineSearch, 
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineMenu
} from 'react-icons/hi';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Mock user data - replace with real user context
  const user = {
    name: 'Juan Pérez',
    email: 'juan@empresa.com',
    role: 'Administrador',
    avatar: null
  };

  const handleLogout = async () => {
    // Clear cookies and redirect to login
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  // Mock notifications
  const notifications = [
    { id: 1, type: 'warning', message: 'Presupuesto PRES-2024-001 vence mañana', time: '10:30 AM' },
    { id: 2, type: 'success', message: 'Pago recibido de Cliente ABC', time: '09:15 AM' },
    { id: 3, type: 'info', message: 'Nuevo pedido registrado', time: '08:45 AM' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuToggle}
          >
            <HiOutlineMenu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiOutlineSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar clientes, pedidos..."
                className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Quick stats */}
          <div className="hidden xl:flex items-center space-x-6 text-sm">
            <div className="text-center">
              <p className="text-gray-500">Pendientes</p>
              <p className="font-semibold text-yellow-600">5</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">En Proceso</p>
              <p className="font-semibold text-blue-600">12</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Por Cobrar</p>
              <p className="font-semibold text-green-600">$1.2M</p>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative"
            >
              <HiOutlineBell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>

            {/* Notifications dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Notificaciones</h3>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'warning' ? 'bg-yellow-400' :
                          notification.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button className="text-sm text-blue-600 hover:text-blue-500">
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User profile */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </Button>

            {/* Profile dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <HiOutlineUser className="mr-3 h-4 w-4" />
                    Mi Perfil
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <HiOutlineCog className="mr-3 h-4 w-4" />
                    Configuración
                  </button>
                  <div className="border-t border-gray-200">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <HiOutlineLogout className="mr-3 h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

