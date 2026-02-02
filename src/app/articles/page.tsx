'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArticleSearch } from '@/components/articles/ArticleSearch';
import { ArticleFilters } from '@/components/articles/ArticleFilters';
import { ArticleList } from '@/components/articles/ArticleList';
import { LoadingScreen } from '@/components/ui/Spinner';
import { ArticleWithStock, PaginatedResponse } from '@/types';

async function fetchArticles(params: {
  search: string;
  famille: string;
  hasStock: boolean;
  gennevilliersOnly: boolean;
  page: number;
  limit: number;
}): Promise<PaginatedResponse<ArticleWithStock> & { success: boolean }> {
  const searchParams = new URLSearchParams({
    search: params.search,
    page: params.page.toString(),
    limit: params.limit.toString(),
  });

  if (params.famille) {
    searchParams.set('famille', params.famille);
  }
  if (params.hasStock) {
    searchParams.set('hasStock', 'true');
  }
  if (params.gennevilliersOnly) {
    searchParams.set('gennevilliersOnly', 'true');
  }

  const response = await fetch(`/api/articles?${searchParams}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des articles');
  }
  return response.json();
}

function ArticlesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [famille, setFamille] = useState(searchParams.get('famille') || '');
  const [hasStock, setHasStock] = useState(searchParams.get('hasStock') === 'true');
  const [gennevilliersOnly, setGennevilliersOnly] = useState(searchParams.get('gennevilliersOnly') === 'true');
  const [page, setPage] = useState(1);
  const [allArticles, setAllArticles] = useState<ArticleWithStock[]>([]);
  const limit = 20;

  // Update URL when filters change
  const updateUrl = useCallback((newSearch: string, newFamille: string, newHasStock: boolean, newGennevilliersOnly: boolean) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('q', newSearch);
    if (newFamille) params.set('famille', newFamille);
    if (newHasStock) params.set('hasStock', 'true');
    if (newGennevilliersOnly) params.set('gennevilliersOnly', 'true');

    const queryString = params.toString();
    router.replace(`/articles${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router]);

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    setAllArticles([]);
    updateUrl(value, famille, hasStock, gennevilliersOnly);
  }, [famille, hasStock, gennevilliersOnly, updateUrl]);

  // Handle famille change
  const handleFamilleChange = useCallback((value: string) => {
    setFamille(value);
    setPage(1);
    setAllArticles([]);
    updateUrl(search, value, hasStock, gennevilliersOnly);
  }, [search, hasStock, gennevilliersOnly, updateUrl]);

  // Handle hasStock change
  const handleHasStockChange = useCallback((value: boolean) => {
    setHasStock(value);
    setPage(1);
    setAllArticles([]);
    updateUrl(search, famille, value, gennevilliersOnly);
  }, [search, famille, gennevilliersOnly, updateUrl]);

  // Handle gennevilliersOnly change
  const handleGennevilliersOnlyChange = useCallback((value: boolean) => {
    setGennevilliersOnly(value);
    setPage(1);
    setAllArticles([]);
    updateUrl(search, famille, hasStock, value);
  }, [search, famille, hasStock, updateUrl]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['articles', search, famille, hasStock, gennevilliersOnly, page],
    queryFn: () => fetchArticles({ search, famille, hasStock, gennevilliersOnly, page, limit }),
  });

  // Accumulate articles for infinite scroll
  useEffect(() => {
    if (data?.data) {
      if (page === 1) {
        setAllArticles(data.data);
      } else {
        setAllArticles((prev) => [...prev, ...data.data]);
      }
    }
  }, [data, page]);

  const handleLoadMore = () => {
    if (data?.meta && page < data.meta.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const hasMore = data?.meta ? page < data.meta.totalPages : false;

  return (
    <div className="px-4 py-4">
      {/* Search bar and filters */}
      <div className="sticky top-14 z-40 bg-gray-50 pb-4 -mx-4 px-4 pt-1">
        <ArticleSearch
          value={search}
          onChange={handleSearchChange}
          placeholder="Rechercher par référence ou désignation..."
        />

        {/* Filters */}
        <ArticleFilters
          famille={famille}
          onFamilleChange={handleFamilleChange}
          hasStock={hasStock}
          onHasStockChange={handleHasStockChange}
          gennevilliersOnly={gennevilliersOnly}
          onGennevilliersOnlyChange={handleGennevilliersOnlyChange}
        />

        {/* Results count */}
        {data?.meta && (
          <p className="text-sm text-gray-500 mt-2">
            {data.meta.total} article{data.meta.total > 1 ? 's' : ''} trouvé{data.meta.total > 1 ? 's' : ''}
            {gennevilliersOnly && ' à Gennevilliers'}
          </p>
        )}
      </div>

      {/* Articles list */}
      <ArticleList
        articles={allArticles}
        isLoading={isLoading && page === 1}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isLoadingMore={isFetching && page > 1}
        searchTerm={search}
      />
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingScreen message="Chargement..." />}>
        <ArticlesContent />
      </Suspense>
    </MainLayout>
  );
}
