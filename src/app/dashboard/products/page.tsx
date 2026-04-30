'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { formatCurrency, getStockStatus, getStockStatusColor, getStockStatusLabel } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  size: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category: Category;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  minStock: number;
  image: string | null;
  color: string | null;
  variants: Variant[];
}

const defaultForm = {
  name: '',
  sku: '',
  categoryId: '',
  price: 0,
  costPrice: 0,
  unit: 'pcs',
  minStock: 5,
  image: '',
  color: '',
  sizes: ['S', 'M', 'L', 'XL'],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newSize, setNewSize] = useState('');
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterCategory) params.set('categoryId', filterCategory);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data);
    } catch {
      showToast('Gagal memuat produk', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, showToast]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const openCreate = () => {
    setForm(defaultForm);
    setEditMode(false);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      price: product.price,
      costPrice: product.costPrice,
      unit: product.unit,
      minStock: product.minStock,
      image: product.image || '',
      color: product.color || '',
      sizes: product.variants.map(v => v.size),
    });
    setSelectedProduct(product);
    setEditMode(true);
    setShowDetail(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.categoryId) {
      showToast('Lengkapi nama, SKU, dan kategori', 'warning');
      return;
    }

    setSaving(true);
    try {
      const url = editMode ? `/api/products/${selectedProduct!.id}` : '/api/products';
      const method = editMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          costPrice: Number(form.costPrice),
          minStock: Number(form.minStock),
          image: form.image || null,
          color: form.color || null,
          sizes: form.sizes,
          ...(editMode && {
            variants: form.sizes.map(size => {
              const existing = selectedProduct?.variants.find(v => v.size === size);
              return existing ? { id: existing.id, size } : { size };
            }),
          }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan', 'error');
        return;
      }

      showToast(editMode ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan', 'success');
      setShowModal(false);
      fetchProducts();
    } catch {
      showToast('Gagal menyimpan produk', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menghapus', 'error');
        return;
      }
      showToast('Produk berhasil dihapus', 'success');
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      showToast('Gagal menghapus produk', 'error');
    }
  };

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setShowDetail(true);
  };

  const addSize = () => {
    const size = newSize.trim().toUpperCase();
    if (size && !form.sizes.includes(size)) {
      setForm({ ...form, sizes: [...form.sizes, size] });
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    // Don't allow removing sizes that have stock (in edit mode)
    if (editMode) {
      const variant = selectedProduct?.variants.find(v => v.size === size);
      if (variant && variant.stock > 0) {
        showToast(`Tidak bisa hapus size ${size}, masih ada stok ${variant.stock}`, 'warning');
        return;
      }
    }
    setForm({ ...form, sizes: form.sizes.filter(s => s !== size) });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-gray-500 text-sm">{products.length} produk</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Tambah Produk</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Cari nama, SKU, atau warna..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-gray-400" />}
          title="Belum ada produk"
          description={search || filterCategory ? 'Tidak ada produk yang sesuai filter' : 'Mulai dengan menambahkan produk pertama Anda'}
          action={
            !search && !filterCategory ? (
              <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                Tambah Produk
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product) => {
            const status = getStockStatus(product.stock, product.minStock);
            return (
              <div
                key={product.id}
                onClick={() => openDetail(product)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStockStatusColor(status)}`}>
                    {getStockStatusLabel(status)}
                  </span>
                </div>
                {product.price > 0 && (
                  <p className="text-sm font-medium text-blue-600 mb-2">{formatCurrency(product.price)}</p>
                )}
                {/* Size grid */}
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <div
                      key={v.id}
                      className={`text-xs px-2 py-1 rounded-md font-medium ${
                        v.stock > 0
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {v.size}: {v.stock}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Total: {product.stock} {product.unit}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Produk">
        {selectedProduct && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Kategori</p>
                <p className="font-medium text-gray-900">{selectedProduct.category.name}</p>
              </div>
              {selectedProduct.color && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Warna</p>
                  <p className="font-medium text-gray-900">{selectedProduct.color}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Harga Jual</p>
                <p className="font-medium text-gray-900">{formatCurrency(selectedProduct.price)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Harga Beli</p>
                <p className="font-medium text-gray-900">{formatCurrency(selectedProduct.costPrice)}</p>
              </div>
            </div>

            {/* Variants table */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Stok per Size</p>
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-4 py-2 font-medium text-gray-500">Size</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500">Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.variants.map((v) => (
                      <tr key={v.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2 font-medium">{v.size}</td>
                        <td className={`px-4 py-2 text-right font-medium ${
                          v.stock > 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {v.stock}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right">{selectedProduct.stock}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openEdit(selectedProduct)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setDeleteTarget(selectedProduct);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMode ? 'Edit Produk' : 'Tambah Produk'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Kaos Polos Putih"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="KP-PTH"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Putih"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">Pilih</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran (Size)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.sizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {size}
                  <button
                    onClick={() => removeSize(size)}
                    className="ml-1 text-blue-400 hover:text-red-500 text-lg leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                placeholder="Tambah size (misal: XXL)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              <button
                onClick={addSize}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 min-h-[44px]"
              >
                Tambah
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : editMode ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Produk"
        message={`Yakin ingin menghapus "${deleteTarget?.name}"? Data stok terkait juga akan dihapus.`}
      />
    </div>
  );
}
