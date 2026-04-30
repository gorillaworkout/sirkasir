import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existing = await d1Query('SELECT id FROM Category WHERE name = ? AND id != ?', [name.trim(), id]);
    if ((existing as unknown[]).length > 0) {
      return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await d1Query('UPDATE Category SET name = ?, updatedAt = ? WHERE id = ?', [name.trim(), now, id]);

    return NextResponse.json({ id, name: name.trim(), updatedAt: now });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const products = await d1Query('SELECT COUNT(*) as count FROM Product WHERE categoryId = ?', [id]);
    const productsCount = (products as { count: number }[])[0]?.count || 0;

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Kategori masih memiliki ${productsCount} produk. Pindahkan produk terlebih dahulu.` },
        { status: 400 }
      );
    }

    await d1Query('DELETE FROM Category WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
