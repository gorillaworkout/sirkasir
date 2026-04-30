import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';
import { generateId } from '@/lib/ids';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const products = await d1Query(
      `SELECT p.*, c.id as catId, c.name as catName, c.createdAt as catCreatedAt, c.updatedAt as catUpdatedAt
       FROM Product p JOIN Category c ON p.categoryId = c.id WHERE p.id = ?`, [id]
    );
    const row = (products as Record<string, unknown>[])[0];
    if (!row) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const variants = await d1Query(
      `SELECT * FROM ProductVariant WHERE productId = ? ORDER BY CASE size WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN 'S' THEN 4 WHEN 'M' THEN 5 WHEN 'L' THEN 6 WHEN 'XL' THEN 7 WHEN 'XXL' THEN 8 WHEN '3XL' THEN 9 WHEN '4XL' THEN 10 ELSE 11 END`, [id]
    );

    const movements = await d1Query(
      `SELECT sm.*, pv.size as variantSize FROM StockMovement sm 
       LEFT JOIN ProductVariant pv ON sm.variantId = pv.id
       WHERE sm.productId = ? ORDER BY sm.createdAt DESC LIMIT 20`, [id]
    );

    const totalStock = (variants as { stock: number }[]).reduce((sum, v) => sum + v.stock, 0);

    const product = {
      id: row.id, name: row.name, sku: row.sku, categoryId: row.categoryId,
      price: row.price, costPrice: row.costPrice, stock: totalStock, unit: row.unit,
      minStock: row.minStock, image: row.image, color: row.color,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
      category: { id: row.catId, name: row.catName, createdAt: row.catCreatedAt, updatedAt: row.catUpdatedAt },
      variants,
      stockMovements: movements,
    };

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sku, categoryId, price, costPrice, unit, minStock, image, color, variants } = body;

    if (sku) {
      const existing = await d1Query('SELECT id FROM Product WHERE sku = ? AND id != ?', [sku, id]);
      if ((existing as unknown[]).length > 0) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    }

    const sets: string[] = [];
    const vals: unknown[] = [];

    if (name !== undefined) { sets.push('name = ?'); vals.push(name); }
    if (sku !== undefined) { sets.push('sku = ?'); vals.push(sku); }
    if (categoryId !== undefined) { sets.push('categoryId = ?'); vals.push(categoryId); }
    if (price !== undefined) { sets.push('price = ?'); vals.push(price); }
    if (costPrice !== undefined) { sets.push('costPrice = ?'); vals.push(costPrice); }
    if (unit !== undefined) { sets.push('unit = ?'); vals.push(unit); }
    if (minStock !== undefined) { sets.push('minStock = ?'); vals.push(minStock); }
    if (image !== undefined) { sets.push('image = ?'); vals.push(image); }
    if (color !== undefined) { sets.push('color = ?'); vals.push(color); }

    const now = new Date().toISOString();
    sets.push('updatedAt = ?');
    vals.push(now);
    vals.push(id);

    if (sets.length > 1) {
      await d1Query(`UPDATE Product SET ${sets.join(', ')} WHERE id = ?`, vals);
    }

    // Update or add variants if provided
    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          // existing variant - update size, price, costPrice
          await d1Query('UPDATE ProductVariant SET size = ?, price = ?, costPrice = ?, updatedAt = ? WHERE id = ?', 
            [v.size, v.price ?? 0, v.costPrice ?? 0, now, v.id]);
        } else {
          // new variant
          const varId = generateId();
          await d1Query(
            'INSERT INTO ProductVariant (id, productId, size, stock, price, costPrice, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?, ?, ?)',
            [varId, id, v.size, v.price ?? 0, v.costPrice ?? 0, now, now]
          );
        }
      }
    }

    // Fetch updated product with category and variants
    const updated = await d1Query(
      `SELECT p.*, c.id as catId, c.name as catName, c.createdAt as catCreatedAt, c.updatedAt as catUpdatedAt
       FROM Product p JOIN Category c ON p.categoryId = c.id WHERE p.id = ?`, [id]
    );
    const r = (updated as Record<string, unknown>[])[0];
    const updatedVariants = await d1Query(
      `SELECT * FROM ProductVariant WHERE productId = ? ORDER BY CASE size WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN 'S' THEN 4 WHEN 'M' THEN 5 WHEN 'L' THEN 6 WHEN 'XL' THEN 7 WHEN 'XXL' THEN 8 WHEN '3XL' THEN 9 WHEN '4XL' THEN 10 ELSE 11 END`, [id]
    );
    const totalStock = (updatedVariants as { stock: number }[]).reduce((sum, v) => sum + v.stock, 0);

    return NextResponse.json({
      id: r.id, name: r.name, sku: r.sku, categoryId: r.categoryId,
      price: r.price, costPrice: r.costPrice, stock: totalStock, unit: r.unit,
      minStock: r.minStock, image: r.image, color: r.color,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
      category: { id: r.catId, name: r.catName, createdAt: r.catCreatedAt, updatedAt: r.catUpdatedAt },
      variants: updatedVariants,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const receiptItems = await d1Query('SELECT id FROM ReceiptItem WHERE productId = ? LIMIT 1', [id]);
    if ((receiptItems as unknown[]).length > 0) {
      return NextResponse.json(
        { error: 'Produk tidak bisa dihapus karena sudah ada di struk penjualan' },
        { status: 400 }
      );
    }

    await d1Query('DELETE FROM StockMovement WHERE productId = ?', [id]);
    await d1Query('DELETE FROM ProductVariant WHERE productId = ?', [id]);
    await d1Query('DELETE FROM Product WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
