'use client';

import { useState, useEffect } from 'react';
import {
  Package, AlertTriangle, ArrowUpDown, DollarSign,
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, Clock
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayTransactions: number;
  totalStockValue: number;
  todayRevenue: number;
  recentMovements: {
    id: string;
    type: string;
    quantity: number;
    note: string | null;
    reference: string | null;
    createdAt: string;
    product: { name: string; unit: string };
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    minStock: number;
    unit: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="p-4 text-center text-red-500">Gagal memuat data</div>;

  const cards = [
    {
      label: 'Total Produk',
      value: data.totalProducts.toString(),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Stok Rendah',
      value: data.lowStockCount.toString(),
      icon: AlertTriangle,
      color: 'bg-yellow-50 text-yellow-600',
      iconBg: 'bg-yellow-100',
      link: '/dashboard/products',
    },
    {
      label: 'Transaksi Hari Ini',
      value: data.todayTransactions.toString(),
      icon: ArrowUpDown,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      label: 'Nilai Stok',
      value: formatCurrency(data.totalStockValue),
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      small: true,
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Ringkasan inventori Anda</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {cards.map((card) => {
          const content = (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color.split(' ')[1]}`} />
                </div>
              </div>
              <p className={`font-bold ${card.small ? 'text-lg' : 'text-2xl'} text-gray-900`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          );

          return card.link ? (
            <Link key={card.label} href={card.link}>{content}</Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      {/* Today Revenue */}
      {data.todayRevenue > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 md:p-6 mb-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Pendapatan Hari Ini</p>
              <p className="text-2xl font-bold">{formatCurrency(data.todayRevenue)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Low Stock Alert - only show when there are actual warnings */}
        {data.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Peringatan Stok
            </h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
              {data.lowStockProducts.length} item
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {data.lowStockProducts.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">Min: {product.minStock} {product.unit}</p>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  product.stock <= 0
                    ? 'text-red-600 bg-red-50'
                    : 'text-yellow-600 bg-yellow-50'
                }`}>
                  {product.stock} {product.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Aktivitas Terbaru
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentMovements.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Belum ada aktivitas
              </div>
            ) : (
              data.recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    movement.type === 'IN' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {movement.type === 'IN' ? (
                      <ArrowDownToLine className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{movement.product.name}</span>
                      {' '}&middot; {movement.quantity} {movement.product.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(movement.createdAt)}
                      {movement.reference && ` · ${movement.reference}`}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    movement.type === 'IN'
                      ? 'text-green-600 bg-green-50'
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {movement.type === 'IN' ? 'Masuk' : 'Keluar'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/stock-in"
          className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors min-h-[60px]"
        >
          <ArrowDownToLine className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Stok Masuk</p>
            <p className="text-xs text-green-600">Tambah stok baru</p>
          </div>
        </Link>
        <Link
          href="/dashboard/stock-out"
          className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors min-h-[60px]"
        >
          <ArrowUpFromLine className="w-6 h-6 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">Stok Keluar</p>
            <p className="text-xs text-blue-600">Catat penjualan</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
