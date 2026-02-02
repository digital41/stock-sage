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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="px-4 py-4 lg:px-8 lg:py-6">
      {/* Page header - Desktop */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-500 mt-1">
            Consultez et recherchez les articles en stock
          </p>
        </div>
        {data?.meta && (
          <div className="text-right bg-white rounded-xl px-6 py-4 border border-gray-200">
            <p className="text-3xl font-bold text-blue-600">{data.meta.total.toLocaleString('fr-FR')}</p>
            <p className="text-sm text-gray-500">articles{gennevilliersOnly && ' a Gennevilliers'}</p>
          </div>
        )}
      </div>

      {/* Search bar and filters - Fixed on mobile */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-gray-50 px-4 pb-3 pt-2 lg:static lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0">
        <div className="lg:bg-white lg:rounded-xl lg:border lg:border-gray-200 lg:p-4">
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

          {/* Results count - Mobile only */}
          {data?.meta && (
            <p className="text-sm text-gray-500 mt-2 lg:hidden">
              {data.meta.total} article{data.meta.total > 1 ? 's' : ''} trouve{data.meta.total > 1 ? 's' : ''}
              {gennevilliersOnly && ' a Gennevilliers'}
            </p>
          )}
        </div>
      </div>
      {/* Spacer for fixed search bar on mobile */}
      <div className="h-32 lg:hidden" />

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
