'use client';

import { useState, useEffect } from 'react';
import { Receipt, Calendar, Eye } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

interface ReceiptData {
  id: string;
  receiptNumber: string;
  customerName: string | null;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  paymentStatus: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    product: { name: string; unit: string };
  }[];
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/receipts?${params}`);
      const data = await res.json();
      setReceipts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [dateFrom, dateTo, statusFilter]);

  const totalRevenue = receipts.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Struk Penjualan</h1>
        <p className="text-gray-500 text-sm">{receipts.length} struk</p>
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        >
          <option value="ALL">Semua Status</option>
          <option value="LUNAS">Lunas</option>
          <option value="BELUM_LUNAS">Belum Lunas (DP & Tunda)</option>
        </select>
        {(dateFrom || dateTo || statusFilter !== 'ALL') && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter('ALL'); }}
            className="px-4 py-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl min-h-[44px]"
          >
            Reset
          </button>
        )}
      </div>

      {/* Total Revenue */}
      {receipts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-700">Total Pendapatan</span>
          <span className="text-lg font-bold text-blue-700">{formatCurrency(totalRevenue)}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : receipts.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-gray-400" />}
          title="Belum ada struk"
          description="Struk akan otomatis dibuat saat Anda mencatat stok keluar"
        />
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <Link
              key={receipt.id}
              href={`/dashboard/receipts/${receipt.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-900 text-sm">{receipt.receiptNumber}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDateTime(receipt.createdAt)}</p>
                  {receipt.customerName && (
                    <p className="text-xs text-gray-500 mt-0.5">Pelanggan: {receipt.customerName}</p>
                  )}
                  {receipt.paymentStatus !== 'LUNAS' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">
                      {receipt.paymentStatus === 'DP' ? 'DP' : 'TUNDA BAYAR'}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {receipt.items.length} item: {receipt.items.map((i) => i.product.name).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-gray-900">{formatCurrency(receipt.totalAmount)}</p>
                  <Eye className="w-4 h-4 text-gray-400 mt-2 ml-auto" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
