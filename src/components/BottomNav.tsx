'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Receipt, BarChart3, Tags, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';

const mainLinks = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Produk', icon: Package },
  { href: '/dashboard/stock-in', label: 'Stok Masuk', icon: ArrowDownToLine },
  { href: '/dashboard/stock-out', label: 'Stok Keluar', icon: ArrowUpFromLine },
];

const moreLinks = [
  { href: '/dashboard/receipts', label: 'Struk', icon: Receipt },
  { href: '/dashboard/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/dashboard/categories', label: 'Kategori', icon: Tags },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const { handleLogout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="fixed inset-0 bg-black/30" />
          <div className="absolute bottom-20 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 min-w-[200px]">
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMore(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isActive(link.href) ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-red-600 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 md:hidden no-print">
        <div className="flex items-center justify-around px-2">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 min-w-[64px] min-h-[56px] justify-center transition-colors ${
                isActive(link.href) ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{link.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-1 py-2 px-3 min-w-[64px] min-h-[56px] justify-center transition-colors ${
              showMore || moreLinks.some((l) => isActive(l.href)) ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
}
