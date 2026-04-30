'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

interface AuthContextType {
  authenticated: boolean;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  handleLogout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    setLoading(false);

    if (!auth && pathname !== '/login') {
      router.replace('/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
