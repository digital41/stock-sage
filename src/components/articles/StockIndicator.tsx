'use client';

import { cn } from '@/lib/utils';
import { stockLevelColors, stockLevelLabels, formatQuantity } from '@/lib/utils';
import { StockLevel } from '@/types';

interface StockIndicatorProps {
  level: StockLevel;
  quantity: number;
  unite?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StockIndicator({
  level,
  quantity,
  unite,
  showLabel = true,
  size = 'md',
}: StockIndicatorProps) {
  const colors = stockLevelColors[level];
  const label = stockLevelLabels[level];

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full font-medium', colors.bg, colors.text, sizes[size])}>
      <span className={cn('w-2 h-2 rounded-full', {
        'bg-red-500': level === 'rupture',
        'bg-orange-500': level === 'bas',
        'bg-green-500': level === 'normal',
        'bg-blue-500': level === 'surplus',
      })} />
      <span>
        {formatQuantity(quantity, unite)}
        {showLabel && <span className="ml-1 opacity-75">({label})</span>}
      </span>
    </div>
  );
}

// Version compacte pour les listes
export function StockDot({ level }: { level: StockLevel }) {
  return (
    <span
      className={cn('w-3 h-3 rounded-full flex-shrink-0', {
        'bg-red-500': level === 'rupture',
        'bg-orange-500': level === 'bas',
        'bg-green-500': level === 'normal',
        'bg-blue-500': level === 'surplus',
      })}
      title={stockLevelLabels[level]}
    />
  );
}
