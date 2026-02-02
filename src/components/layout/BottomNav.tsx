'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Warehouse, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/articles',
    label: 'Articles',
    icon: Package,
  },
  {
    href: '/stock-bas',
    label: 'Stock bas',
    icon: AlertTriangle,
  },
  {
    href: '/depots',
    label: 'Depots',
    icon: Warehouse,
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
