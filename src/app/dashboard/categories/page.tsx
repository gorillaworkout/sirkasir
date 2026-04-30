'use client';

import { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, Trash2, Package } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';

interface Category {
  id: string;
  name: string;
  _count: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch {
      showToast('Gagal memuat kategori', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setName('');
    setEditTarget(null);
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setName(category.name);
    setEditTarget(category);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Nama kategori tidak boleh kosong', 'warning');
      return;
    }

    setSaving(true);
    try {
      const url = editTarget ? `/api/categories/${editTarget.id}` : '/api/categories';
      const method = editTarget ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan', 'error');
        return;
      }

      showToast(editTarget ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan', 'success');
      setShowModal(false);
      fetchCategories();
    } catch {
      showToast('Gagal menyimpan kategori', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal menghapus', 'error');
        return;
      }
      showToast('Kategori berhasil dihapus', 'success');
      setDeleteTarget(null);
      fetchCategories();
    } catch {
      showToast('Gagal menghapus kategori', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
          <p className="text-gray-500 text-sm">{categories.length} kategori</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          Tambah
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="w-8 h-8 text-gray-400" />}
          title="Belum ada kategori"
          description="Buat kategori untuk mengorganisir produk Anda"
          action={
            <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              Tambah Kategori
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Tags className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {category._count.products} produk
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(category)}
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(category)}
                  className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? 'Edit Kategori' : 'Tambah Kategori'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Makanan, Minuman, dll."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
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
            ) : editTarget ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori"
        message={`Yakin ingin menghapus kategori "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
