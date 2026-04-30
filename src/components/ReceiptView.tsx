'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Store, Printer } from 'lucide-react';

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
    }[];
  };
  onPrint?: () => void;
}

export default function ReceiptView({ receipt, onPrint }: ReceiptViewProps) {
  return (
    <div className="bg-white max-w-md mx-auto">
      {/* Header */}
      <div className="text-center pb-4 border-b-2 border-dashed border-gray-300">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Store className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sirkasir</h2>
        <p className="text-sm text-gray-500">Struk Penjualan</p>
      </div>

      {/* Info */}
      <div className="py-3 border-b border-dashed border-gray-300 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">No. Struk</span>
          <span className="font-mono font-medium">{receipt.receiptNumber}</span>
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

      {/* Items */}
      <div className="py-3 border-b border-dashed border-gray-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left pb-2 font-medium">Item</th>
              <th className="text-center pb-2 font-medium">Qty</th>
              <th className="text-right pb-2 font-medium">Harga</th>
              <th className="text-right pb-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="py-2 pr-2">
                  <p className="text-gray-900">{item.product.name}</p>
                </td>
                <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                <td className="py-2 text-right text-gray-600">{formatCurrency(item.price)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* Print button */}
      {onPrint && (
        <div className="no-print pt-2">
          <button
            onClick={onPrint}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Printer className="w-5 h-5" />
            Cetak Struk
          </button>
        </div>
      )}
    </div>
  );
}
