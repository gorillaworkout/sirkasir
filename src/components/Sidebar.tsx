'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  Receipt, BarChart3, Tags, LogOut, ChevronLeft, ChevronRight, Store
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

const links = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Produk', icon: Package },
  { href: '/dashboard/stock-in', label: 'Stok Masuk', icon: ArrowDownToLine },
  { href: '/dashboard/stock-out', label: 'Stok Keluar', icon: ArrowUpFromLine },
  { href: '/dashboard/receipts', label: 'Struk', icon: Receipt },
  { href: '/dashboard/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/dashboard/categories', label: 'Kategori', icon: Tags },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { handleLogout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-[72px]' : 'w-64'
    } min-h-screen sticky top-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Sirkasir</h1>
            <p className="text-xs text-gray-500">Inventory Management</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors min-h-[44px] ${
              isActive(link.href)
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            title={collapsed ? link.label : undefined}
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors w-full min-h-[44px]"
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Keluar</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors w-full min-h-[44px]"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Perkecil</span>}
        </button>
      </div>
    </aside>
  );
}
