'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DepotCard } from '@/components/depots/DepotCard';
import { LoadingScreen } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { DepotWithStats } from '@/types';

async function fetchDepots(): Promise<{ success: boolean; data: DepotWithStats[] }> {
  const response = await fetch('/api/depots');
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des dépôts');
  }
  return response.json();
}

export default function DepotsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['depots'],
    queryFn: fetchDepots,
  });

  const depots = data?.data || [];

  // Calculer les stats globales
  const totalArticles = depots.reduce((sum, d) => sum + d.nombreArticles, 0);
  const totalValeur = depots.reduce((sum, d) => sum + d.valeurStock, 0);

  return (
    <MainLayout>
      <div className="px-4 py-4 lg:px-8 lg:py-6">
        {/* Page header - Desktop */}
        <div className="lg:flex lg:items-center lg:justify-between lg:mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Depots</h1>
            <p className="text-gray-500 mt-1 hidden lg:block">
              Consultez le stock par entrepot
            </p>
          </div>
          {!isLoading && depots.length > 0 && (
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              <div className="text-right bg-white rounded-xl px-6 py-4 border border-gray-200">
                <p className="text-2xl font-bold text-gray-900">{depots.length}</p>
                <p className="text-sm text-gray-500">depots</p>
              </div>
              <div className="text-right bg-white rounded-xl px-6 py-4 border border-gray-200">
                <p className="text-2xl font-bold text-blue-600">{totalArticles.toLocaleString('fr-FR')}</p>
                <p className="text-sm text-gray-500">articles total</p>
              </div>
              {isAdmin && (
                <div className="text-right bg-white rounded-xl px-6 py-4 border border-gray-200">
                  <p className="text-2xl font-bold text-green-600">{totalValeur.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
                  <p className="text-sm text-gray-500">valeur totale</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile title spacing */}
        <div className="lg:hidden mb-4"></div>

        {isLoading ? (
          <LoadingScreen message="Chargement des depots..." />
        ) : depots.length === 0 ? (
          <EmptyState
            icon="package"
            title="Aucun depot"
            description="Aucun depot trouve dans la base Sage"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            {depots.map((depot) => (
              <DepotCard key={depot.code} depot={depot} showValeur={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
