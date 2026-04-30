import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';
import { generateId } from '@/lib/ids';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await d1Query(
      `SELECT c.*, COUNT(p.id) as productCount
       FROM Category c
       LEFT JOIN Product p ON p.categoryId = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    // Format to match Prisma's _count shape
    const formatted = (categories as { id: string; name: string; createdAt: string; updatedAt: string; productCount: number }[]).map(c => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      _count: { products: c.productCount },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existing = await d1Query('SELECT id FROM Category WHERE name = ?', [name.trim()]);
    if ((existing as unknown[]).length > 0) {
      return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    await d1Query(
      'INSERT INTO Category (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [id, name.trim(), now, now]
    );

    return NextResponse.json({ id, name: name.trim(), createdAt: now, updatedAt: now }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
