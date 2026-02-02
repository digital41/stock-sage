'use client';

import { use, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Warehouse, Package } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArticleSearch } from '@/components/articles/ArticleSearch';
import { Depot, DepotStockItem, PaginatedResponse } from '@/types';
import { formatPrice, formatQuantity } from '@/lib/utils';
import Link from 'next/link';

async function fetchDepotStock(
  code: number,
  params: { search: string; page: number; limit: number }
): Promise<{ success: boolean; depot: Depot; data: DepotStockItem[]; meta: PaginatedResponse<DepotStockItem>['meta'] }> {
  const searchParams = new URLSearchParams({
    search: params.search,
    page: params.page.toString(),
    limit: params.limit.toString(),
  });

  const response = await fetch(`/api/depots/${code}/stock?${searchParams}`);
  if (!response.ok) {
    throw new Error('Dépôt non trouvé');
  }
  return response.json();
}

export default function DepotDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const depotCode = parseInt(code);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<DepotStockItem[]>([]);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['depot-stock', depotCode, search, page],
    queryFn: () => fetchDepotStock(depotCode, { search, page, limit }),
    enabled: !isNaN(depotCode),
  });

  // Reset when search changes
  useEffect(() => {
    setPage(1);
    setAllItems([]);
  }, [search]);

  // Accumulate items
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllItems(data.data);
      } else {
        setAllItems((prev) => [...prev, ...data.data]);
      }
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (data?.meta && page < data.meta.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const hasMore = data?.meta ? page < data.meta.totalPages : false;
  const depot = data?.depot;

  if (isNaN(depotCode)) {
    return (
      <MainLayout>
        <div className="px-4 py-8 text-center">
          <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Code dépôt invalide</h2>
          <Button onClick={() => router.back()} className="mt-4">
            Retour
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 py-4">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>

        {/* Depot header */}
        {depot && (
          <Card variant="bordered" padding="md" className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {depot.intitule}
                  </h1>
                  {depot.principal && (
                    <Badge variant="info" size="sm">Principal</Badge>
                  )}
                </div>
                {depot.ville && (
                  <p className="text-sm text-gray-500">{depot.ville}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Search */}
        <div className="sticky top-14 z-40 bg-gray-50 pb-4 -mx-4 px-4 pt-1">
          <ArticleSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher dans ce dépôt..."
          />

          {data?.meta && (
            <p className="text-sm text-gray-500 mt-2">
              {data.meta.total} article{data.meta.total > 1 ? 's' : ''} en stock
            </p>
          )}
        </div>

        {/* Stock list */}
        {isLoading && page === 1 ? (
          <LoadingScreen message="Chargement du stock..." />
        ) : allItems.length === 0 ? (
          <EmptyState
            icon="search"
            title={search ? 'Aucun résultat' : 'Aucun stock'}
            description={
              search
                ? `Aucun article ne correspond à "${search}"`
                : 'Ce dépôt ne contient aucun article en stock'
            }
          />
        ) : (
          <div className="space-y-2">
            {allItems.map((item, index) => (
              <Link
                key={`${item.article.reference}-${index}`}
                href={`/articles/${encodeURIComponent(item.article.reference)}`}
              >
                <Card variant="bordered" padding="sm" className="hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-blue-600 truncate">
                        {item.article.reference}
                      </p>
                      <p className="text-sm text-gray-900 truncate">
                        {item.article.designation}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatQuantity(item.quantite)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.prixVente)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {hasMore && (
              <div className="py-4 text-center">
                <Button
                  onClick={handleLoadMore}
                  isLoading={isFetching && page > 1}
                  variant="secondary"
                >
                  Charger plus
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
