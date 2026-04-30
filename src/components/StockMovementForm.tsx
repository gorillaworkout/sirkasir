'use client';

import { useState, useEffect } from 'react';
import { Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Variant {
  id: string;
  productId: string;
  size: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  unit: string;
  price: number;
  costPrice: number;
  color: string | null;
  variants: Variant[];
}

interface StockEntry {
  productId: string;
  variantId: string;
  productName: string;
  variantSize: string;
  quantity: number;
  unit: string;
  note: string;
  price: number;
  variantStock: number;
}

interface StockMovementFormProps {
  type: 'IN' | 'OUT';
  onSubmit: (entries: StockEntry[], extraData?: { customerName?: string; note?: string }) => Promise<void>;
  loading: boolean;
}

export default function StockMovementForm({ type, onSubmit, loading }: StockMovementFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.color && p.color.toLowerCase().includes(search.toLowerCase()))
  );

  const addVariant = (product: Product, variant: Variant) => {
    if (entries.some(e => e.variantId === variant.id)) return;

    setEntries([
      ...entries,
      {
        productId: product.id,
        variantId: variant.id,
        productName: `${product.name} - ${variant.size}`,
        variantSize: variant.size,
        quantity: 1,
        unit: product.unit,
        note: '',
        price: type === 'OUT' ? product.price : product.costPrice,
        variantStock: variant.stock,
      },
    ]);
  };

  const updateEntry = (index: number, field: keyof StockEntry, value: string | number) => {
    const updated = [...entries];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setEntries(updated);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const totalAmount = entries.reduce((sum, e) => sum + e.price * e.quantity, 0);

  const handleSubmit = async () => {
    if (entries.length === 0) return;
    await onSubmit(entries, { customerName, note });
    setEntries([]);
    setCustomerName('');
    setNote('');
  };

  const toggleProduct = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  return (
    <div className="space-y-4">
      {/* Search filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Filter produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
      </div>

      {/* Product list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {loadingProducts ? (
          <div className="p-4 text-center text-gray-500 text-sm">Memuat produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">Produk tidak ditemukan</div>
        ) : (
          filteredProducts.map((product) => {
            const isExpanded = expandedProduct === product.id;
            const addedVariants = entries.filter(e => e.productId === product.id).length;
            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleProduct(product.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left min-h-[52px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                      {addedVariants > 0 && (
                        <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                          {addedVariants}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{product.sku} · Stok: {product.stock}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 py-2">Pilih size:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {product.variants.map((variant) => {
                        const alreadyAdded = entries.some(e => e.variantId === variant.id);
                        const noStock = type === 'OUT' && variant.stock <= 0;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => addVariant(product, variant)}
                            disabled={alreadyAdded || noStock}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                              alreadyAdded
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : noStock
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100'
                            }`}
                          >
                            <span className="block text-sm font-semibold">{variant.size}</span>
                            <span className={`block text-[10px] ${variant.stock > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {variant.stock}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selected entries */}
      {entries.length > 0 && (
        <>
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Item dipilih ({entries.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {entries.map((entry, index) => (
                <div key={entry.variantId} className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 text-sm">{entry.productName}</p>
                    <button
                      onClick={() => removeEntry(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        max={type === 'OUT' ? entry.variantStock : undefined}
                        value={entry.quantity || ''}
                        onChange={(e) => updateEntry(index, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 block">
                        {type === 'OUT' ? 'Harga' : 'Harga Beli'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={entry.price || ''}
                        onChange={(e) => updateEntry(index, 'price', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="text-right min-w-[80px]">
                      <label className="text-[10px] text-gray-500 block">Subtotal</label>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(entry.price * entry.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer name (OUT only) */}
          {type === 'OUT' && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Nama Pelanggan (opsional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Catatan (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          {/* Summary & Submit */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total ({entries.length} item)</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || entries.some((e) => e.quantity <= 0)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : type === 'IN' ? (
                'Simpan Stok Masuk'
              ) : (
                'Buat Struk & Simpan'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
