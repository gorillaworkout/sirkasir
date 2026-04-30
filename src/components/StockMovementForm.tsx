'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
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
  const [showProductList, setShowProductList] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.color && p.color.toLowerCase().includes(search.toLowerCase())))
  );

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearch('');
    setShowProductList(false);
  };

  const addVariant = (product: Product, variant: Variant) => {
    // Check if this variant is already in entries
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
    setSelectedProduct(null);
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

  return (
    <div className="space-y-4">
      {/* Product Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk (nama/warna)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowProductList(true);
              setSelectedProduct(null);
            }}
            onFocus={() => setShowProductList(true)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
        </div>

        {showProductList && !selectedProduct && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowProductList(false)} />
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {loadingProducts ? (
                <div className="p-4 text-center text-gray-500 text-sm">Memuat produk...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {search ? 'Produk tidak ditemukan' : 'Tidak ada produk'}
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku} · Total stok: {product.stock} {product.unit}</p>
                    </div>
                    <Plus className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Size Selection Modal */}
      {selectedProduct && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="font-medium text-gray-900 mb-2">{selectedProduct.name}</p>
          <p className="text-xs text-gray-500 mb-3">Pilih size:</p>
          <div className="flex flex-wrap gap-2">
            {selectedProduct.variants.map((variant) => {
              const alreadyAdded = entries.some(e => e.variantId === variant.id);
              return (
                <button
                  key={variant.id}
                  onClick={() => addVariant(selectedProduct, variant)}
                  disabled={alreadyAdded}
                  className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                    alreadyAdded
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {variant.size}
                  <span className="block text-xs font-normal">
                    Stok: {variant.stock}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setSelectedProduct(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Batal
          </button>
        </div>
      )}

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={entry.variantId} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{entry.productName}</p>
                  {type === 'OUT' && (
                    <p className="text-xs text-gray-500">Stok: {entry.variantStock} {entry.unit}</p>
                  )}
                </div>
                <button
                  onClick={() => removeEntry(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    max={type === 'OUT' ? entry.variantStock : undefined}
                    value={entry.quantity || ''}
                    onChange={(e) => updateEntry(index, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {type === 'OUT' ? 'Harga Jual' : 'Harga Beli'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={entry.price || ''}
                    onChange={(e) => updateEntry(index, 'price', e.target.value === '' ? 0 : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="text-xs text-gray-500 mb-1 block">Catatan (opsional)</label>
                <input
                  type="text"
                  value={entry.note}
                  onChange={(e) => updateEntry(index, 'note', e.target.value)}
                  placeholder="Catatan..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm font-medium text-gray-900">
                  Subtotal: {formatCurrency(entry.price * entry.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer name (OUT only) */}
      {type === 'OUT' && entries.length > 0 && (
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
      {entries.length > 0 && (
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Catatan Umum (opsional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan..."
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {/* Summary & Submit */}
      {entries.length > 0 && (
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
      )}

      {/* Empty state */}
      {entries.length === 0 && !selectedProduct && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Cari dan pilih produk di atas untuk memulai</p>
        </div>
      )}
    </div>
  );
}
