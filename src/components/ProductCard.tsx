'use client';

import { getStockStatus, getStockStatusColor, getStockStatusLabel, formatCurrency } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    costPrice: number;
    stock: number;
    unit: string;
    minStock: number;
    image?: string | null;
    category?: { name: string };
  };
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const status = getStockStatus(product.stock, product.minStock);
  const statusColor = getStockStatusColor(status);
  const statusLabel = getStockStatusLabel(status);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <Package className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <p className="text-xs text-gray-500">{product.sku}</p>
          {product.category && (
            <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {product.category.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.price)}</p>
          <p className="text-xs text-gray-500">Stok: {product.stock} {product.unit}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
