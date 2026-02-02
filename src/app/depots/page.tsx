'use client';

import { useQuery } from '@tanstack/react-query';
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
  const { data, isLoading } = useQuery({
    queryKey: ['depots'],
    queryFn: fetchDepots,
  });

  const depots = data?.data || [];

  return (
    <MainLayout>
      <div className="px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Dépôts</h1>

        {isLoading ? (
          <LoadingScreen message="Chargement des dépôts..." />
        ) : depots.length === 0 ? (
          <EmptyState
            icon="package"
            title="Aucun dépôt"
            description="Aucun dépôt trouvé dans la base Sage"
          />
        ) : (
          <div className="space-y-3">
            {depots.map((depot) => (
              <DepotCard key={depot.code} depot={depot} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
