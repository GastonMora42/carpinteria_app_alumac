import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HiOutlineHome, 
  HiOutlineUsers, 
  HiOutlineClipboardCheck,
  HiOutlineCash,
  HiOutlineDatabase,
  HiOutlineCog
} from 'react-icons/hi';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HiOutlineHome },
  { name: 'Clientes', href: '/clientes', icon: HiOutlineUsers },
  { name: 'Pedidos', href: '/pedidos', icon: HiOutlineClipboardCheck },
  { name: 'Finanzas', href: '/finanzas', icon: HiOutlineCash },
  { name: 'Inventario', href: '/inventario', icon: HiOutlineDatabase },
  { name: 'Configuración', href: '/configuracion', icon: HiOutlineCog },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-blue-800 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-white text-2xl font-bold">AlumGestión</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue-900 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-white' : 'text-blue-300'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}