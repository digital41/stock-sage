'use client';

import { useSession, signOut } from 'next-auth/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, LogOut, RefreshCw, Database } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchSageStatus(): Promise<{ success: boolean; available: boolean }> {
  try {
    // Try to fetch articles to check if Sage is available
    const response = await fetch('/api/articles?limit=1');
    return { success: true, available: response.ok };
  } catch {
    return { success: false, available: false };
  }
}

export default function ProfilPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: sageStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['sage-status'],
    queryFn: fetchSageStatus,
    refetchInterval: 60000, // Check every minute
  });

  const handleRefreshCache = async () => {
    // Invalidate all queries to refresh data
    await queryClient.invalidateQueries();
    await refetchStatus();
  };

  return (
    <MainLayout>
      <div className="px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Profil</h1>

        {/* User info */}
        <Card variant="bordered" padding="md" className="mb-4">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-medium text-gray-900">
                  {session?.user?.name || 'Utilisateur'}
                </p>
                {session?.user?.role === 'admin' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Sage status */}
        <Card variant="bordered" padding="md" className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                sageStatus?.available ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Database className={`w-5 h-5 ${
                  sageStatus?.available ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Connexion Sage 100</p>
                <p className={`text-sm ${
                  sageStatus?.available ? 'text-green-600' : 'text-red-600'
                }`}>
                  {sageStatus?.available ? 'Connecté' : 'Non disponible'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleRefreshCache}
            variant="secondary"
            className="w-full justify-start"
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            Actualiser les données
          </Button>

          <Button
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="danger"
            className="w-full justify-start"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Se déconnecter
          </Button>
        </div>

        {/* App info */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Stock Sage 100</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </MainLayout>
  );
}
