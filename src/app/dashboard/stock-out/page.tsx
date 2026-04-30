'use client';

import { useState } from 'react';
import { ArrowUpFromLine, Receipt, Eye } from 'lucide-react';
import StockMovementForm from '@/components/StockMovementForm';
import Modal from '@/components/Modal';
import ReceiptView from '@/components/ReceiptView';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function StockOutPage() {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(0);
  const [lastReceipt, setLastReceipt] = useState<{
    id: string;
    receiptNumber: string;
    customerName?: string | null;
    totalAmount: number;
    note?: string | null;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      price: number;
      subtotal: number;
      product: { name: string; unit: string };
      variantSize?: string | null;
    }[];
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (
    entries: { productId: string; variantId: string; quantity: number; note: string; price: number }[],
    extraData?: { customerName?: string; note?: string }
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OUT',
          entries: entries.map((e) => ({
            productId: e.productId,
            variantId: e.variantId,
            quantity: e.quantity,
            note: e.note,
            price: e.price,
          })),
          customerName: extraData?.customerName,
          note: extraData?.note,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan', 'error');
        return;
      }

      const data = await res.json();
      setLastReceipt(data.receipt);
      setShowReceipt(true);
      showToast(`Struk ${data.receiptNumber} berhasil dibuat`, 'success');
      setKey((k) => k + 1);
    } catch {
      showToast('Gagal membuat struk', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stok Keluar</h1>
            <p className="text-gray-500 text-sm">Catat penjualan dan buat struk</p>
          </div>
        </div>
      </div>

      {lastReceipt && !showReceipt && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Struk terakhir: {lastReceipt.receiptNumber}</p>
              <p className="text-xs text-green-600">Klik untuk melihat</p>
            </div>
          </div>
          <button
            onClick={() => setShowReceipt(true)}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      )}

      <StockMovementForm key={key} type="OUT" onSubmit={handleSubmit} loading={loading} />

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Struk Penjualan" maxWidth="max-w-md">
        {lastReceipt && (
          <div>
            <ReceiptView
              receipt={lastReceipt}
              onPrint={() => window.print()}
            />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href={`/dashboard/receipts/${lastReceipt.id}`}
                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Lihat Detail Struk →
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
