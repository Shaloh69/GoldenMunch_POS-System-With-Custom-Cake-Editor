'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Sidebar } from '@/components/sidebar';

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-mesh-gradient">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
