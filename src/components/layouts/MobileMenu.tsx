// ===================================

// src/components/layouts/MobileMenu.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HiOutlineHome, 
  HiOutlineUsers, 
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineDatabase,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineX
} from 'react-icons/hi';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HiOutlineHome },
  { name: 'Ventas', href: '/ventas', icon: HiOutlineClipboardCheck },
  { name: 'Presupuestos', href: '/presupuestos', icon: HiOutlineDocumentText },
  { name: 'Clientes', href: '/clientes', icon: HiOutlineUsers },
  { name: 'Finanzas', href: '/finanzas', icon: HiOutlineCash },
  { name: 'Materiales', href: '/materiales', icon: HiOutlineDatabase },
  { name: 'Reportes', href: '/reportes', icon: HiOutlineChartBar },
  { name: 'Configuración', href: '/configuracion', icon: HiOutlineCog },
];

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-40 flex">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <HiOutlineX className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-white text-xl font-bold">AlumGestión</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`${
                      isActive
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-white' : 'text-blue-300'
                      } mr-4 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}