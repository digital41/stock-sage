'use client';

import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Header for mobile only */}
      <div className="lg:hidden">
        <Header />
      </div>

      {/* Main content */}
      <main className="pb-20 lg:pb-0 lg:pl-64">
        <div className="lg:max-w-7xl lg:mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom nav for mobile only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
