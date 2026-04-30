'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Calendar, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Package } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

interface Movement {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  reference: string | null;
  createdAt: string;
  product: { name: string; sku: string; unit: string };
  variantSize?: string | null;
}

interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  unit: string;
  stock: number;
  price: number;
  costPrice: number;
  totalIn: number;
  totalOut: number;
  stockValue: number;
  sellValue: number;
}

interface ReportData {
  movements: Movement[];
  productSummary: ProductSummary[];
  stats: {
    totalStockValue: number;
    totalSellValue: number;
    totalIn: number;
    totalOut: number;
    totalMovements: number;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'movements'>('summary');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await fetch(`/api/reports?${params}`);
      const d = await res.json();
      setData(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-500 text-sm">Ringkasan stok dan pergerakan barang</p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="px-4 py-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl min-h-[44px]"
          >
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !data ? (
        <EmptyState
          icon={<BarChart3 className="w-8 h-8 text-gray-400" />}
          title="Gagal memuat laporan"
          description="Coba refresh halaman"
        />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(data.stats.totalStockValue)}</p>
              <p className="text-xs text-gray-500">Nilai Stok (Modal)</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(data.stats.totalSellValue)}</p>
              <p className="text-xs text-gray-500">Nilai Stok (Jual)</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowDownToLine className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{data.stats.totalIn}</p>
              <p className="text-xs text-gray-500">Total Stok Masuk</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowUpFromLine className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{data.stats.totalOut}</p>
              <p className="text-xs text-gray-500">Total Stok Keluar</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ringkasan Produk
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'movements' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Riwayat Pergerakan
            </button>
          </div>

          {/* Product Summary Tab */}
          {activeTab === 'summary' && (
            data.productSummary.length === 0 ? (
              <EmptyState
                icon={<Package className="w-8 h-8 text-gray-400" />}
                title="Belum ada data"
                description="Belum ada pergerakan stok pada periode ini"
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {data.productSummary.map((product) => (
                    <div key={product.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Stok: {product.stock} {product.unit}</span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">↓ Masuk: {product.totalIn}</span>
                        <span className="text-red-600">↑ Keluar: {product.totalOut}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Nilai: {formatCurrency(product.stockValue)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produk</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Masuk</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Keluar</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nilai Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.productSummary.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{product.totalIn}</td>
                        <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{product.totalOut}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{product.stock} {product.unit}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{formatCurrency(product.stockValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Movements Tab */}
          {activeTab === 'movements' && (
            data.movements.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="w-8 h-8 text-gray-400" />}
                title="Belum ada pergerakan"
                description="Belum ada stok masuk atau keluar pada periode ini"
              />
            ) : (
              <div className="space-y-2">
                {data.movements.map((movement) => (
                  <div key={movement.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      movement.type === 'IN' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {movement.type === 'IN' ? (
                        <ArrowDownToLine className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpFromLine className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {movement.product.name}
                        {movement.variantSize && <span className="text-gray-500"> ({movement.variantSize})</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.quantity} {movement.product.unit}
                        {movement.reference && ` · ${movement.reference}`}
                        {movement.note && ` · ${movement.note}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(movement.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                      movement.type === 'IN' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}>
                      {movement.type === 'IN' ? 'Masuk' : 'Keluar'}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
