'use client';

import { cn } from '@/lib/utils';
import { Package, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'package' | 'search';
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

const icons = {
  package: Package,
  search: Search,
};

export function EmptyState({ icon = 'package', title, description, className, children }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
