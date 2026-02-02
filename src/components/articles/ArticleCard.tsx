'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StockDot } from './StockIndicator';
import { ArticleWithStock } from '@/types';
import { formatPrice, formatQuantity } from '@/lib/utils';

interface ArticleCardProps {
  article: ArticleWithStock;
  showSeuilMini?: boolean;
}

export function ArticleCard({ article, showSeuilMini = false }: ArticleCardProps) {
  return (
    <Link href={`/articles/${encodeURIComponent(article.reference)}`}>
      <Card variant="bordered" padding="md" className="hover:border-blue-300 hover:shadow-sm transition-all active:scale-[0.99]">
        <div className="flex items-start gap-3">
          {/* Stock indicator */}
          <div className="pt-1">
            <StockDot level={article.niveauStock} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-blue-600 truncate">
                  {article.reference}
                </p>
                <p className="text-gray-900 font-medium line-clamp-2 mt-0.5">
                  {article.designation}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {article.famille && (
                  <Badge variant="default" size="sm">
                    {article.famille}
                  </Badge>
                )}
                {showSeuilMini && article.seuilMini && article.seuilMini > 0 && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    Seuil: {formatQuantity(article.seuilMini)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {formatQuantity(article.stockTotal, article.unite)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(article.prixVente)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
