'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, Warehouse } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import { StockIndicator } from '@/components/articles/StockIndicator';
import { ArticleDetail } from '@/types';
import { formatPrice, formatQuantity } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

async function fetchArticleDetail(reference: string): Promise<{ success: boolean; data: ArticleDetail }> {
  // Toujours demander des données fraîches pour éviter les incohérences avec la liste
  const response = await fetch(`/api/articles/${encodeURIComponent(reference)}?fresh=true`);
  if (!response.ok) {
    throw new Error('Article non trouvé');
  }
  return response.json();
}

export default function ArticleDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const decodedRef = decodeURIComponent(reference);

  // Vérifier si l'utilisateur est admin
  const isAdmin = session?.user?.role === 'admin';

  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['article', decodedRef],
    queryFn: () => fetchArticleDetail(decodedRef),
    staleTime: 0, // Données considérées comme périmées immédiatement
    refetchOnMount: 'always', // Toujours rafraîchir à chaque visite de la page
  });

  // Formater la date de mise à jour
  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const article = data?.data;

  // Trouver le stock KLY GENNEVILLIERS pour l'affichage principal
  const klyGennevilliers = article?.stockParDepot.find(
    (s) => s.depotIntitule.toUpperCase().includes('KLY GENNEVILLIERS')
  );
  const stockPrincipal = klyGennevilliers ? klyGennevilliers.quantite : 0;
  const stockDisponiblePrincipal = klyGennevilliers ? klyGennevilliers.disponible : 0;

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingScreen message="Chargement de l'article..." />
      </MainLayout>
    );
  }

  if (error || !article) {
    return (
      <MainLayout>
        <div className="px-4 py-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Article non trouvé</h2>
          <p className="text-gray-500 mt-1">La référence &quot;{decodedRef}&quot; n&apos;existe pas.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Retour
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 py-4 lg:px-8 lg:py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4 -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>

        {/* Desktop: Two column layout */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left column - Main info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Article header */}
            <Card variant="bordered" padding="md" className="lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm lg:text-base font-medium text-blue-600">
                    {article.reference}
                  </p>
                  <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-1">
                    {article.designation}
                  </h1>
                  {article.familleIntitule && (
                    <Badge variant="default" size="sm" className="mt-2">
                      {article.familleIntitule}
                    </Badge>
                  )}
                </div>
                <div className="hidden lg:block">
                  <StockIndicator
                    level={
                      stockDisponiblePrincipal === 0
                        ? 'rupture'
                        : klyGennevilliers?.stockMini && klyGennevilliers.stockMini > 0 && stockDisponiblePrincipal <= klyGennevilliers.stockMini
                          ? 'bas'
                          : 'normal'
                    }
                    quantity={stockDisponiblePrincipal}
                    size="lg"
                  />
                </div>
              </div>
            </Card>

            {/* Stock KLY GENNEVILLIERS */}
            <Card variant="bordered" padding="none" className="overflow-hidden">
              <div className="px-4 py-3 lg:px-6 lg:py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-gray-500" />
                    <h2 className="font-medium text-gray-900">KLY Gennevilliers</h2>
                  </div>
                  {lastUpdate && (
                    <button
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                      <span>{lastUpdate}</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="px-4 py-4 lg:px-6 lg:py-6">
                <div className="flex items-center justify-between">
                  <div className="flex gap-8 lg:gap-12">
                    <div>
                      <p className="text-sm text-gray-500">Stock total</p>
                      <p className="text-3xl lg:text-4xl font-bold text-gray-900 mt-1">
                        {formatQuantity(stockPrincipal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Stock disponible</p>
                      <p className="text-3xl lg:text-4xl font-bold text-blue-600 mt-1">
                        {formatQuantity(stockDisponiblePrincipal)}
                      </p>
                    </div>
                  </div>
                  <div className="lg:hidden">
                    <StockIndicator
                      level={
                        stockDisponiblePrincipal === 0
                          ? 'rupture'
                          : klyGennevilliers?.stockMini && klyGennevilliers.stockMini > 0 && stockDisponiblePrincipal <= klyGennevilliers.stockMini
                            ? 'bas'
                            : 'normal'
                      }
                      quantity={stockDisponiblePrincipal}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Stock by depot */}
            <Card variant="bordered" padding="none" className="overflow-hidden">
              <div className="px-4 py-3 lg:px-6 lg:py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-gray-500" />
                  <h2 className="font-medium text-gray-900">Stock par depot</h2>
                </div>
              </div>

              {article.stockParDepot.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  Aucun stock enregistre
                </div>
              ) : (
                <div className="divide-y divide-gray-200 lg:grid lg:grid-cols-2 lg:divide-y-0">
                  {article.stockParDepot.map((stock, index) => (
                    <div key={stock.depotCode} className={`px-4 py-4 lg:px-6 lg:py-5 ${index % 2 === 0 ? 'lg:border-r lg:border-gray-200' : ''} ${index > 1 ? 'lg:border-t lg:border-gray-200' : ''}`}>
                      <p className="font-medium text-gray-900 mb-3">{stock.depotIntitule}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-6 lg:gap-8">
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-0.5">
                              {formatQuantity(stock.quantite)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Disponible</p>
                            <p className="text-xl lg:text-2xl font-bold text-blue-600 mt-0.5">
                              {formatQuantity(stock.disponible)}
                            </p>
                          </div>
                        </div>
                        <StockIndicator
                          level={
                            stock.disponible === 0
                              ? 'rupture'
                              : stock.stockMini > 0 && stock.disponible <= stock.stockMini
                                ? 'bas'
                                : 'normal'
                          }
                          quantity={stock.disponible}
                          size="md"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column - Tarifs (Desktop) */}
          <div className="mt-4 lg:mt-0 space-y-4">
            {/* Tarifs */}
            <Card variant="bordered" padding="none" className="overflow-hidden lg:sticky lg:top-6">
              <div className="px-4 py-3 lg:px-6 lg:py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">Tarifs</h2>
              </div>
              <div className="px-4 py-4 lg:px-6 lg:py-6">
                <div className={isAdmin ? 'space-y-4' : ''}>
                  {/* Prix d'achat - Admin uniquement */}
                  {isAdmin && (
                    <div className="pb-4 border-b border-gray-100">
                      <p className="text-sm text-gray-500">Prix d&apos;achat</p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
                        {formatPrice(article.prixAchat)}
                      </p>
                    </div>
                  )}
                  <div className={isAdmin ? 'pb-4 border-b border-gray-100' : ''}>
                    <p className="text-sm text-gray-500">Prix de vente</p>
                    <p className="text-2xl lg:text-3xl font-bold text-blue-600 mt-1">
                      {formatPrice(article.prixVente)}
                    </p>
                  </div>
                  {/* Marge - Admin uniquement */}
                  {isAdmin && (
                    <div>
                      <p className="text-sm text-gray-500">Marge</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className={`text-2xl lg:text-3xl font-bold ${article.prixVente - article.prixAchat >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(article.prixVente - article.prixAchat)}
                        </p>
                        {article.prixAchat > 0 && (
                          <p className="text-sm text-gray-500">
                            ({((article.prixVente - article.prixAchat) / article.prixAchat * 100).toFixed(1)}%)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {article.codeBarres && (
                <div className="px-4 pb-4 lg:px-6 lg:pb-6">
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Code-barres</p>
                    <p className="font-mono text-gray-900 lg:text-lg">{article.codeBarres}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
