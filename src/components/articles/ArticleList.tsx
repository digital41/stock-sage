'use client';

import { ArticleCard } from './ArticleCard';
import { LoadingScreen } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ArticleWithStock } from '@/types';

interface ArticleListProps {
  articles: ArticleWithStock[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  searchTerm?: string;
  emptyMessage?: string;
  showSeuilMini?: boolean;
}

export function ArticleList({
  articles,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
  searchTerm,
  emptyMessage,
  showSeuilMini = false,
}: ArticleListProps) {
  if (isLoading) {
    return <LoadingScreen message="Chargement des articles..." />;
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={searchTerm ? 'Aucun resultat' : (emptyMessage || 'Aucun article')}
        description={
          searchTerm
            ? `Aucun article ne correspond a "${searchTerm}"`
            : (emptyMessage || 'Aucun article trouve dans la base Sage')
        }
      />
    );
  }

  return (
    <div>
      {/* Grid responsive: 1 col mobile, 2 cols tablette, 3 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.reference} article={article} showSeuilMini={showSeuilMini} />
        ))}
      </div>

      {hasMore && (
        <div className="py-6 text-center">
          <Button
            onClick={onLoadMore}
            isLoading={isLoadingMore}
            variant="secondary"
            className="px-8"
          >
            Charger plus d'articles
          </Button>
        </div>
      )}
    </div>
  );
}
