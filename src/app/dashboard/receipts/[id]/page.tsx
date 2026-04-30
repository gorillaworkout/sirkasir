'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import ReceiptView from '@/components/ReceiptView';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

interface ReceiptData {
  id: string;
  receiptNumber: string;
  customerName: string | null;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    product: { name: string; unit: string; sku: string };
  }[];
}

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setReceipt(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Struk tidak ditemukan');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/dashboard/receipts" className="text-blue-600 hover:underline">
          ← Kembali ke daftar struk
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 md:bg-gray-50 receipt-page-wrapper">
      {/* Back + Print bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between no-print">
        <Link
          href="/dashboard/receipts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </Link>
        <button
          onClick={() => {
            const originalTitle = document.title;
            const name = receipt?.customerName || 'Struk';
            document.title = `${name} - ${receipt?.receiptNumber || 'Struk'}`;
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          <Printer className="w-4 h-4" />
          Cetak
        </button>
      </div>

      {/* Receipt - centered, clean */}
      <div className="max-w-sm mx-auto py-6 px-4 receipt-print-area">
        {receipt && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 receipt-print-area">
            <ReceiptView receipt={receipt} />
          </div>
        )}
      </div>
    </div>
  );
}
