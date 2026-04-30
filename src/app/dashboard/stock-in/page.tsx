'use client';

import { useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import StockMovementForm from '@/components/StockMovementForm';
import { useToast } from '@/components/Toast';

export default function StockInPage() {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(0);
  const { showToast } = useToast();

  const handleSubmit = async (entries: { productId: string; quantity: number; note: string }[]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'IN',
          entries: entries.map((e) => ({
            productId: e.productId,
            quantity: e.quantity,
            note: e.note,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan', 'error');
        return;
      }

      showToast(`${entries.length} produk berhasil ditambahkan stoknya`, 'success');
      setKey((k) => k + 1); // Reset form
    } catch {
      showToast('Gagal menyimpan stok masuk', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stok Masuk</h1>
            <p className="text-gray-500 text-sm">Tambah stok produk dari pembelian</p>
          </div>
        </div>
      </div>

      <StockMovementForm key={key} type="IN" onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
