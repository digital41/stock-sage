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
    <div className="space-y-3">
      {articles.map((article) => (
        <ArticleCard key={article.reference} article={article} showSeuilMini={showSeuilMini} />
      ))}

      {hasMore && (
        <div className="py-4 text-center">
          <Button
            onClick={onLoadMore}
            isLoading={isLoadingMore}
            variant="secondary"
          >
            Charger plus
          </Button>
        </div>
      )}
    </div>
  );
}
