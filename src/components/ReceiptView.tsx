'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, Download } from 'lucide-react';
import Image from 'next/image';

interface ReceiptViewProps {
  receipt: {
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
      product: {
        name: string;
        unit: string;
      };
      variantSize?: string | null;
    }[];
  };
  onPrint?: () => void;
}

export default function ReceiptView({ receipt, onPrint }: ReceiptViewProps) {
  return (
    <div className="bg-white max-w-md mx-auto">
      {/* Header */}
      <div className="text-center pb-4 border-b-2 border-dashed border-gray-300">
        <Image
          src="/logo-kikihoka.png"
          alt="Kikihoka Kaospolos"
          width={72}
          height={72}
          className="mx-auto mb-2"
        />
        <h2 className="text-xl font-bold text-gray-900">Kikihoka Kaospolos</h2>
        <p className="text-sm text-gray-500">Struk Penjualan</p>
      </div>

      {/* Info */}
      <div className="py-3 border-b border-dashed border-gray-300 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">No. Struk</span>
          <span className="font-mono font-medium text-xs">{receipt.receiptNumber}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tanggal</span>
          <span>{formatDateTime(receipt.createdAt)}</span>
        </div>
        {receipt.customerName && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Pelanggan</span>
            <span>{receipt.customerName}</span>
          </div>
        )}
      </div>

      {/* Items - vertical layout for better space */}
      <div className="py-3 border-b border-dashed border-gray-300 space-y-3">
        {receipt.items.map((item) => (
          <div key={item.id} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
            <p className="text-sm font-medium text-gray-900">
              {item.product.name}
              {item.variantSize && <span className="text-gray-500"> ({item.variantSize})</span>}
            </p>
            <div className="flex justify-between text-sm text-gray-600 mt-0.5">
              <span>{item.quantity} × {formatCurrency(item.price)}</span>
              <span className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="py-3 border-b border-dashed border-gray-300">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-blue-600">{formatCurrency(receipt.totalAmount)}</span>
        </div>
      </div>

      {/* Note */}
      {receipt.note && (
        <div className="py-3 border-b border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Catatan: {receipt.note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-sm text-gray-500">Terima kasih atas pembelian Anda!</p>
      </div>

      {/* Action buttons */}
      {onPrint && (
        <div className="no-print pt-2 flex gap-2">
          <button
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Printer className="w-5 h-5" />
            Cetak
          </button>
          <button
            onClick={() => {
              const originalTitle = document.title;
              const name = receipt.customerName || 'Struk';
              document.title = `${name} - ${receipt.receiptNumber}`;
              window.print();
              setTimeout(() => { document.title = originalTitle; }, 500);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors min-h-[44px]"
          >
            <Download className="w-5 h-5" />
            Simpan PDF
          </button>
        </div>
      )}
    </div>
  );
}
