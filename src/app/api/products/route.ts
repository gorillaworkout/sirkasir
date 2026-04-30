import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';
import { generateId } from '@/lib/ids';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    let sql = `SELECT p.*, c.id as catId, c.name as catName, c.createdAt as catCreatedAt, c.updatedAt as catUpdatedAt
               FROM Product p
               JOIN Category c ON p.categoryId = c.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      conditions.push('p.categoryId = ?');
      params.push(categoryId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY p.createdAt DESC';

    const rows = await d1Query(sql, params);

    // Format to match Prisma include shape
    interface ProductRow {
      id: string; name: string; sku: string; categoryId: string;
      price: number; costPrice: number; stock: number; unit: string;
      minStock: number; image: string | null; createdAt: string; updatedAt: string;
      catId: string; catName: string; catCreatedAt: string; catUpdatedAt: string;
    }
    const products = (rows as ProductRow[]).map(r => ({
      id: r.id, name: r.name, sku: r.sku, categoryId: r.categoryId,
      price: r.price, costPrice: r.costPrice, stock: r.stock, unit: r.unit,
      minStock: r.minStock, image: r.image, createdAt: r.createdAt, updatedAt: r.updatedAt,
      category: { id: r.catId, name: r.catName, createdAt: r.catCreatedAt, updatedAt: r.catUpdatedAt },
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, categoryId, price, costPrice, stock, unit, minStock, image } = body;

    if (!name || !sku || !categoryId) {
      return NextResponse.json({ error: 'Name, SKU, and category are required' }, { status: 400 });
    }

    const existing = await d1Query('SELECT id FROM Product WHERE sku = ?', [sku]);
    if ((existing as unknown[]).length > 0) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    await d1Query(
      `INSERT INTO Product (id, name, sku, categoryId, price, costPrice, stock, unit, minStock, image, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, sku, categoryId, price || 0, costPrice || 0, stock || 0, unit || 'pcs', minStock || 5, image || null, now, now]
    );

    // Fetch the category for response
    const cats = await d1Query('SELECT * FROM Category WHERE id = ?', [categoryId]);
    const cat = (cats as { id: string; name: string; createdAt: string; updatedAt: string }[])[0];

    return NextResponse.json({
      id, name, sku, categoryId, price: price || 0, costPrice: costPrice || 0,
      stock: stock || 0, unit: unit || 'pcs', minStock: minStock || 5,
      image: image || null, createdAt: now, updatedAt: now,
      category: cat,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
