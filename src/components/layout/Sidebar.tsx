'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Package, Warehouse, User, AlertTriangle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/articles',
    label: 'Articles',
    icon: Package,
    description: 'Consulter le stock',
  },
  {
    href: '/stock-bas',
    label: 'Stock bas',
    icon: AlertTriangle,
    description: 'Alertes de stock',
  },
  {
    href: '/depots',
    label: 'Depots',
    icon: Warehouse,
    description: 'Stock par depot',
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: User,
    description: 'Mon compte',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-200">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900">Stock Sage</h1>
          <p className="text-xs text-gray-500">Gestion de stock</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-blue-600')} />
              <div>
                <p className="text-sm">{item.label}</p>
                <p className={cn('text-xs', isActive ? 'text-blue-500' : 'text-gray-400')}>
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || 'Utilisateur'}
            </p>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
              {session?.user?.role === 'admin' && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sage status indicator */}
        <div className="flex items-center gap-2 mt-3 px-3 text-xs text-gray-500">
          <Database className="w-3.5 h-3.5" />
          <span>Sage 100 connecte</span>
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        </div>
      </div>
    </aside>
  );
}
