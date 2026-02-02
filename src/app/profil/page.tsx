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
      <div className="px-4 py-4 lg:px-8 lg:py-6">
        {/* Page header - Desktop */}
        <div className="hidden lg:block lg:mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
          <p className="text-gray-500 mt-1">Gerez votre compte et vos parametres</p>
        </div>

        {/* Mobile title */}
        <h1 className="text-xl font-semibold text-gray-900 mb-4 lg:hidden">Profil</h1>

        {/* Desktop: Two column layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left column */}
          <div className="space-y-4">
            {/* User info */}
            <Card variant="bordered" padding="md" className="lg:p-6">
              <div className="flex items-center gap-4">
                {session?.user?.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg lg:text-xl font-medium text-gray-900">
                      {session?.user?.name || 'Utilisateur'}
                    </p>
                    {session?.user?.role === 'admin' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm lg:text-base text-gray-500">
                    {session?.user?.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 hidden lg:block">
                    Role: {session?.user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Sage status */}
            <Card variant="bordered" padding="md" className="lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center ${
                    sageStatus?.available ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Database className={`w-5 h-5 lg:w-6 lg:h-6 ${
                      sageStatus?.available ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 lg:text-lg">Connexion Sage 100</p>
                    <p className={`text-sm ${
                      sageStatus?.available ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sageStatus?.available ? 'Connecte' : 'Non disponible'}
                    </p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${sageStatus?.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="mt-4 lg:mt-0 space-y-4">
            {/* Actions */}
            <Card variant="bordered" padding="md" className="lg:p-6">
              <h3 className="font-medium text-gray-900 mb-4 hidden lg:block">Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleRefreshCache}
                  variant="secondary"
                  className="w-full justify-start lg:justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-3" />
                  Actualiser les donnees
                </Button>

                <Button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  variant="danger"
                  className="w-full justify-start lg:justify-center"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Se deconnecter
                </Button>
              </div>
            </Card>

            {/* App info */}
            <Card variant="bordered" padding="md" className="lg:p-6">
              <h3 className="font-medium text-gray-900 mb-3 hidden lg:block">A propos</h3>
              <div className="text-center lg:text-left text-sm text-gray-500">
                <p className="font-medium text-gray-700">KlyStock</p>
                <p>Version 1.0.0</p>
                <p className="mt-2 text-xs text-gray-400">Application de consultation de stock</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
