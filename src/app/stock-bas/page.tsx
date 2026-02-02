'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArticleSearch } from '@/components/articles/ArticleSearch';
import { ArticleList } from '@/components/articles/ArticleList';
import { LoadingScreen } from '@/components/ui/Spinner';
import { ArticleWithStock, PaginatedResponse } from '@/types';
import { AlertTriangle, Filter, ChevronDown, X, Target } from 'lucide-react';
import { useRef } from 'react';

interface Famille {
  code: string;
  intitule: string;
}

// Options de filtre par seuil
const seuilOptions = [
  { value: '', label: 'Tous les seuils' },
  { value: '0-10', label: 'Seuil < 10' },
  { value: '10-50', label: 'Seuil 10 - 50' },
  { value: '50-100', label: 'Seuil 50 - 100' },
  { value: '100+', label: 'Seuil > 100' },
];

async function fetchFamilles(): Promise<{ success: boolean; data: Famille[] }> {
  const response = await fetch('/api/familles');
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des familles');
  }
  return response.json();
}

async function fetchLowStockArticles(params: {
  search: string;
  famille: string;
  page: number;
  limit: number;
}): Promise<PaginatedResponse<ArticleWithStock> & { success: boolean }> {
  const searchParams = new URLSearchParams({
    search: params.search,
    page: params.page.toString(),
    limit: params.limit.toString(),
    lowStockOnly: 'true',
  });

  if (params.famille) {
    searchParams.set('famille', params.famille);
  }

  const response = await fetch(`/api/articles?${searchParams}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des articles');
  }
  return response.json();
}

function StockBasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const familleDropdownRef = useRef<HTMLDivElement>(null);
  const seuilDropdownRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [famille, setFamille] = useState(searchParams.get('famille') || '');
  const [seuil, setSeuil] = useState(searchParams.get('seuil') || '');
  const [page, setPage] = useState(1);
  const [allArticles, setAllArticles] = useState<ArticleWithStock[]>([]);
  const [isFamilleDropdownOpen, setIsFamilleDropdownOpen] = useState(false);
  const [isSeuilDropdownOpen, setIsSeuilDropdownOpen] = useState(false);
  const limit = 20;

  // Fetch familles for filter
  const { data: famillesData } = useQuery({
    queryKey: ['familles'],
    queryFn: fetchFamilles,
    staleTime: 5 * 60 * 1000,
  });

  const familles = famillesData?.data || [];
  const selectedFamille = familles.find((f) => f.code === famille);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (familleDropdownRef.current && !familleDropdownRef.current.contains(event.target as Node)) {
        setIsFamilleDropdownOpen(false);
      }
      if (seuilDropdownRef.current && !seuilDropdownRef.current.contains(event.target as Node)) {
        setIsSeuilDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update URL when filters change
  const updateUrl = useCallback((newSearch: string, newFamille: string, newSeuil: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set('q', newSearch);
    if (newFamille) params.set('famille', newFamille);
    if (newSeuil) params.set('seuil', newSeuil);

    const queryString = params.toString();
    router.replace(`/stock-bas${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setAllArticles([]);
    updateUrl(value, famille, seuil);
  };

  const handleFamilleChange = (value: string) => {
    setFamille(value);
    setPage(1);
    setAllArticles([]);
    updateUrl(search, value, seuil);
  };

  const handleSeuilChange = (value: string) => {
    setSeuil(value);
    // Ne pas effacer les articles car le filtre seuil est client-side
    updateUrl(search, famille, value);
  };

  // Filtre les articles par seuil (client-side)
  const filterBySeuil = (articles: ArticleWithStock[]) => {
    if (!seuil) return articles;

    return articles.filter((article) => {
      const seuilMini = article.seuilMini || 0;
      switch (seuil) {
        case '0-10':
          return seuilMini > 0 && seuilMini < 10;
        case '10-50':
          return seuilMini >= 10 && seuilMini <= 50;
        case '50-100':
          return seuilMini > 50 && seuilMini <= 100;
        case '100+':
          return seuilMini > 100;
        default:
          return true;
      }
    });
  };

  const selectedSeuilOption = seuilOptions.find((o) => o.value === seuil);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['low-stock-articles', search, famille, page],
    queryFn: () => fetchLowStockArticles({ search, famille, page, limit }),
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

  // Appliquer le filtre seuil
  const filteredArticles = filterBySeuil(allArticles);

  return (
    <div className="px-4 py-4 lg:px-8 lg:py-6">
      {/* Page header - Desktop */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Bas</h1>
            <p className="text-gray-500 mt-1">
              Articles en dessous du seuil minimum a KLY Gennevilliers
            </p>
          </div>
        </div>
        {data?.meta && (
          <div className="text-right bg-orange-50 rounded-xl px-6 py-4 border border-orange-200">
            <p className="text-3xl font-bold text-orange-600">
              {(seuil ? filteredArticles.length : data.meta.total).toLocaleString('fr-FR')}
            </p>
            <p className="text-sm text-orange-700">articles en alerte</p>
          </div>
        )}
      </div>

      {/* Header - Mobile */}
      <div className="sticky top-14 lg:top-0 z-40 bg-gray-50 pb-4 -mx-4 px-4 pt-1 lg:mx-0 lg:px-0 lg:pt-0 lg:pb-6 lg:bg-transparent lg:static">
        {/* Title with icon - Mobile only */}
        <div className="flex items-center gap-2 mb-3 lg:hidden">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Stock Bas</h1>
            <p className="text-xs text-gray-500">Articles en dessous du seuil minimum a KLY Gennevilliers</p>
          </div>
        </div>

        {/* Search and filters container */}
        <div className="lg:bg-white lg:rounded-xl lg:border lg:border-gray-200 lg:p-4">
          {/* Search */}
          <ArticleSearch
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher par reference ou designation..."
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
          {/* Famille dropdown */}
          <div className="relative" ref={familleDropdownRef}>
            <button
              onClick={() => setIsFamilleDropdownOpen(!isFamilleDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                famille
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{selectedFamille ? selectedFamille.intitule : 'Famille'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFamilleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFamilleDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    handleFamilleChange('');
                    setIsFamilleDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    !famille ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  Toutes les familles
                </button>
                {familles.map((f) => (
                  <button
                    key={f.code}
                    onClick={() => {
                      handleFamilleChange(f.code);
                      setIsFamilleDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      famille === f.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {f.intitule || f.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seuil dropdown */}
          <div className="relative" ref={seuilDropdownRef}>
            <button
              onClick={() => setIsSeuilDropdownOpen(!isSeuilDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                seuil
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{selectedSeuilOption?.label || 'Seuil'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSeuilDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSeuilDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {seuilOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleSeuilChange(option.value);
                      setIsSeuilDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      seuil === option.value ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear filters */}
          {(famille || seuil) && (
            <button
              onClick={() => {
                if (famille) {
                  setFamille('');
                  setPage(1);
                  setAllArticles([]);
                }
                setSeuil('');
                updateUrl(search, '', '');
              }}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-3.5 h-3.5" />
              <span>Effacer</span>
            </button>
          )}
        </div>

          {/* Results count - Mobile only */}
          {data?.meta && (
            <p className="text-sm text-gray-500 mt-2 lg:hidden">
              <span className="font-medium text-orange-600">
                {seuil ? filteredArticles.length : data.meta.total}
              </span> article{(seuil ? filteredArticles.length : data.meta.total) > 1 ? 's' : ''} en stock bas
              {seuil && ` (filtre par seuil)`}
            </p>
          )}
        </div>
      </div>

      {/* Articles list */}
      <ArticleList
        articles={filteredArticles}
        isLoading={isLoading && page === 1}
        hasMore={hasMore && !seuil}
        onLoadMore={handleLoadMore}
        isLoadingMore={isFetching && page > 1}
        searchTerm={search}
        emptyMessage="Aucun article en stock bas"
        showSeuilMini={true}
      />
    </div>
  );
}

export default function StockBasPage() {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingScreen message="Chargement..." />}>
        <StockBasContent />
      </Suspense>
    </MainLayout>
  );
}
