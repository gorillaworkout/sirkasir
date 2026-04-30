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
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.color LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      conditions.push('p.categoryId = ?');
      params.push(categoryId);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY p.name ASC';

    const rows = await d1Query(sql, params);

    interface ProductRow {
      id: string; name: string; sku: string; categoryId: string;
      price: number; costPrice: number; stock: number; unit: string;
      minStock: number; image: string | null; color: string | null;
      createdAt: string; updatedAt: string;
      catId: string; catName: string; catCreatedAt: string; catUpdatedAt: string;
    }

    const productIds = (rows as ProductRow[]).map(r => r.id);
    let variants: { id: string; productId: string; size: string; stock: number; price: number; costPrice: number }[] = [];
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      variants = await d1Query(
        `SELECT id, productId, size, stock, price, costPrice FROM ProductVariant WHERE productId IN (${placeholders}) ORDER BY CASE size WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN 'S' THEN 4 WHEN 'M' THEN 5 WHEN 'L' THEN 6 WHEN 'XL' THEN 7 WHEN 'XXL' THEN 8 WHEN '3XL' THEN 9 WHEN '4XL' THEN 10 ELSE 11 END`,
        productIds
      ) as typeof variants;
    }

    const products = (rows as ProductRow[]).map(r => {
      const productVariants = variants.filter(v => v.productId === r.id);
      const totalStock = productVariants.reduce((sum, v) => sum + v.stock, 0);
      return {
        id: r.id, name: r.name, sku: r.sku, categoryId: r.categoryId,
        price: r.price, costPrice: r.costPrice, stock: totalStock, unit: r.unit,
        minStock: r.minStock, image: r.image, color: r.color,
        createdAt: r.createdAt, updatedAt: r.updatedAt,
        category: { id: r.catId, name: r.catName, createdAt: r.catCreatedAt, updatedAt: r.catUpdatedAt },
        variants: productVariants,
      };
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, categoryId, price, costPrice, unit, minStock, image, color, sizes } = body;

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
      `INSERT INTO Product (id, name, sku, categoryId, price, costPrice, stock, unit, minStock, image, color, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [id, name, sku, categoryId, price || 0, costPrice || 0, unit || 'pcs', minStock || 5, image || null, color || null, now, now]
    );

    const defaultSizes = sizes && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'];
    const createdVariants = [];
    for (const sizeEntry of defaultSizes) {
      const varId = generateId();
      const sName = typeof sizeEntry === 'object' ? sizeEntry.size : sizeEntry;
      const sPrice = typeof sizeEntry === 'object' ? (sizeEntry.price || 0) : (price || 0);
      const sCost = typeof sizeEntry === 'object' ? (sizeEntry.costPrice || 0) : (costPrice || 0);
      await d1Query(
        'INSERT INTO ProductVariant (id, productId, size, stock, price, costPrice, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?, ?, ?)',
        [varId, id, sName, sPrice, sCost, now, now]
      );
      createdVariants.push({ id: varId, productId: id, size: sName, stock: 0, price: sPrice, costPrice: sCost });
    }

    const cats = await d1Query('SELECT * FROM Category WHERE id = ?', [categoryId]);
    const cat = (cats as Record<string, unknown>[])[0];

    return NextResponse.json({
      id, name, sku, categoryId, price: price || 0, costPrice: costPrice || 0,
      stock: 0, unit: unit || 'pcs', minStock: minStock || 5,
      image: image || null, color: color || null, createdAt: now, updatedAt: now,
      category: cat,
      variants: createdVariants,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
