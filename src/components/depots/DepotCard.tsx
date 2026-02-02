'use client';

import Link from 'next/link';
import { ChevronRight, Warehouse } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DepotWithStats } from '@/types';
import { formatPrice } from '@/lib/utils';

interface DepotCardProps {
  depot: DepotWithStats;
}

export function DepotCard({ depot }: DepotCardProps) {
  return (
    <Link href={`/depots/${depot.code}`}>
      <Card variant="bordered" padding="md" className="hover:border-blue-300 hover:shadow-sm transition-all active:scale-[0.99]">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Warehouse className="w-5 h-5 text-blue-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">
                    {depot.intitule}
                  </p>
                  {depot.principal && (
                    <Badge variant="info" size="sm">Principal</Badge>
                  )}
                </div>
                {depot.ville && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {depot.ville}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {depot.nombreArticles}
                </p>
                <p className="text-xs text-gray-500">articles</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-blue-600">
                  {formatPrice(depot.valeurStock)}
                </p>
                <p className="text-xs text-gray-500">valeur stock</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
