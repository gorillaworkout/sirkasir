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
    <div className="p-4 md:p-6 max-w-md mx-auto">
      {/* Back button */}
      <div className="mb-4 no-print">
        <Link
          href="/dashboard/receipts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </Link>
      </div>

      {receipt && (
        <ReceiptView
          receipt={receipt}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}
