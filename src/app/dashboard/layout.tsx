'use client';

import AuthProvider from '@/components/AuthProvider';
import { ToastProvider } from '@/components/Toast';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
