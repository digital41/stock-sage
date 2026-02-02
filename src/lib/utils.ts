import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StockLevel } from '@/types';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculer le niveau de stock
export function getStockLevel(quantity: number, threshold?: number | null): StockLevel {
  if (quantity === 0) return 'rupture';
  if (threshold && quantity <= threshold) return 'bas';
  if (threshold && quantity > threshold * 3) return 'surplus';
  return 'normal';
}

// Couleurs par niveau de stock
export const stockLevelColors: Record<StockLevel, { bg: string; text: string; border: string }> = {
  rupture: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  bas: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  normal: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  surplus: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
};

// Labels par niveau de stock
export const stockLevelLabels: Record<StockLevel, string> = {
  rupture: 'Rupture',
  bas: 'Stock bas',
  normal: 'Disponible',
  surplus: 'Surplus',
};

// Formater un prix
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

// Formater une quantité (sans afficher l'unité si c'est un code numérique)
export function formatQuantity(quantity: number, unite?: string): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(quantity);
  // Ne pas afficher l'unité si c'est un code numérique ou vide
  if (!unite || /^\d+$/.test(unite.trim())) {
    return formatted;
  }
  return `${formatted} ${unite}`;
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
