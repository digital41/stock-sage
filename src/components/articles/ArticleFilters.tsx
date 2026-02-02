'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Famille {
  code: string;
  intitule: string;
}

interface ArticleFiltersProps {
  famille: string;
  onFamilleChange: (famille: string) => void;
  hasStock: boolean;
  onHasStockChange: (hasStock: boolean) => void;
  gennevilliersOnly: boolean;
  onGennevilliersOnlyChange: (gennevilliersOnly: boolean) => void;
}

async function fetchFamilles(): Promise<{ success: boolean; data: Famille[] }> {
  const response = await fetch('/api/familles');
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des familles');
  }
  return response.json();
}

export function ArticleFilters({
  famille,
  onFamilleChange,
  hasStock,
  onHasStockChange,
  gennevilliersOnly,
  onGennevilliersOnlyChange,
}: ArticleFiltersProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: famillesData } = useQuery({
    queryKey: ['familles'],
    queryFn: fetchFamilles,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  const familles = famillesData?.data || [];
  const selectedFamille = familles.find((f) => f.code === famille);
  const activeFiltersCount = (famille ? 1 : 0) + (hasStock ? 1 : 0) + (gennevilliersOnly ? 1 : 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearAllFilters = () => {
    onFamilleChange('');
    onHasStockChange(false);
    onGennevilliersOnlyChange(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {/* Famille dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
            famille
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{selectedFamille ? selectedFamille.intitule : 'Famille'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                onFamilleChange('');
                setIsDropdownOpen(false);
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
                  onFamilleChange(f.code);
                  setIsDropdownOpen(false);
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

      {/* Has stock toggle */}
      <button
        onClick={() => onHasStockChange(!hasStock)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
          hasStock
            ? 'bg-green-50 border-green-300 text-green-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>Avec stock</span>
        {hasStock && <X className="w-3.5 h-3.5" />}
      </button>

      {/* Gennevilliers only toggle */}
      <button
        onClick={() => onGennevilliersOnlyChange(!gennevilliersOnly)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
          gennevilliersOnly
            ? 'bg-purple-50 border-purple-300 text-purple-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>Gennevilliers</span>
        {gennevilliersOnly && <X className="w-3.5 h-3.5" />}
      </button>

      {/* Clear all filters */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <X className="w-3.5 h-3.5" />
          <span>Effacer ({activeFiltersCount})</span>
        </button>
      )}
    </div>
  );
}
