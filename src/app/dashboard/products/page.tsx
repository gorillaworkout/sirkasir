'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
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
}

const defaultForm = {
  name: '',
  sku: '',
  categoryId: '',
  price: 0,
  costPrice: 0,
  stock: 0,
  unit: 'pcs',
  minStock: 5,
  image: '',
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
      stock: product.stock,
      unit: product.unit,
      minStock: product.minStock,
      image: product.image || '',
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
          stock: Number(form.stock),
          minStock: Number(form.minStock),
          image: form.image || null,
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
            placeholder="Cari nama atau SKU..."
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

      {/* Products Grid (mobile) / Table (desktop) */}
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
        <>
          {/* Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => openDetail(product)}
              />
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stok</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const status = getStockStatus(product.stock, product.minStock);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.category.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{product.stock} {product.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStockStatusColor(status)}`}>
                          {getStockStatusLabel(status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Product Detail Modal (mobile) */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Produk">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Kategori</p>
                <p className="font-medium text-gray-900">{selectedProduct.category.name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Satuan</p>
                <p className="font-medium text-gray-900">{selectedProduct.unit}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Harga Jual</p>
                <p className="font-medium text-gray-900">{formatCurrency(selectedProduct.price)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Harga Beli</p>
                <p className="font-medium text-gray-900">{formatCurrency(selectedProduct.costPrice)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Stok</p>
                <p className="font-medium text-gray-900">{selectedProduct.stock} {selectedProduct.unit}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Min Stok</p>
                <p className="font-medium text-gray-900">{selectedProduct.minStock} {selectedProduct.unit}</p>
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
              placeholder="Nama produk"
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
                placeholder="SKU-001"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] font-mono"
              />
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

          <div className="grid grid-cols-3 gap-3">
            {!editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="pcs"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stok</label>
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
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
