'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import ReceiptView from '@/components/ReceiptView';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ReceiptData {
  id: string;
  receiptNumber: string;
  customerName: string | null;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  paymentStatus: string;
  dpAmount: number | null;
  dueDate: string | null;
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
  const [showConfirmLunas, setShowConfirmLunas] = useState(false);

  const fetchReceipt = () => {
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
  };

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  const { showToast } = useToast();

  const processMarkAsLunas = async () => {
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'LUNAS' }),
      });
      if (res.ok) {
        showToast('Pembayaran berhasil ditandai LUNAS! 🎉', 'success');
        fetchReceipt();
      } else {
        showToast('Gagal mengupdate status', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const handleMarkAsLunas = () => {
    setShowConfirmLunas(true);
  };

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

      {/* Status banner */}
      {receipt && receipt.paymentStatus !== 'LUNAS' && (
        <div className="max-w-sm mx-auto px-4 mt-4 no-print">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-orange-800">
                  {receipt.paymentStatus === 'DP' ? 'Status: DP' : 'Status: Tunda Bayar'}
                </span>
                {receipt.dueDate && (
                  <p className="text-xs text-orange-600 mt-0.5">
                    Tenggat: {new Date(receipt.dueDate).toLocaleDateString('id-ID')}
                  </p>
                )}
              </div>
              {receipt.paymentStatus === 'DP' && receipt.dpAmount !== null && (
                <div className="text-right">
                  <p className="text-xs text-orange-600">Sisa Bayar</p>
                  <p className="font-bold text-orange-800">
                    Rp {(receipt.totalAmount - receipt.dpAmount).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleMarkAsLunas}
              className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              Tandai Lunas
            </button>
          </div>
        </div>
      )}

      {/* Receipt - centered, clean */}
      <div className="max-w-sm mx-auto py-6 px-4 receipt-print-area">
        {receipt && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 receipt-print-area">
            <ReceiptView receipt={receipt} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmLunas}
        onClose={() => setShowConfirmLunas(false)}
        onConfirm={processMarkAsLunas}
        title="Tandai Lunas"
        message="Apakah Anda yakin tagihan ini sudah dilunasi? Status struk akan berubah menjadi LUNAS."
        confirmText="Ya, Sudah Lunas"
        cancelText="Batal"
        variant="success"
      />
    </div>
  );
}
