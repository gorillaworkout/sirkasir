import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';
import { generateId } from '@/lib/ids';
import { generateReceiptNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const productId = searchParams.get('productId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let sql = `SELECT sm.*, p.name as productName, p.sku as productSku, p.unit as productUnit, p.color as productColor,
               pv.size as variantSize
               FROM StockMovement sm
               JOIN Product p ON sm.productId = p.id
               LEFT JOIN ProductVariant pv ON sm.variantId = pv.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (type) { conditions.push('sm.type = ?'); params.push(type); }
    if (productId) { conditions.push('sm.productId = ?'); params.push(productId); }
    if (from) { conditions.push('sm.createdAt >= ?'); params.push(new Date(from).toISOString()); }
    if (to) { conditions.push('sm.createdAt <= ?'); params.push(new Date(to + 'T23:59:59.999Z').toISOString()); }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY sm.createdAt DESC LIMIT 200';

    const rows = await d1Query(sql, params);

    interface MovementRow {
      id: string; productId: string; variantId: string | null; type: string; quantity: number;
      note: string | null; reference: string | null; createdAt: string;
      productName: string; productSku: string; productUnit: string; productColor: string | null;
      variantSize: string | null;
    }
    const movements = (rows as MovementRow[]).map(r => ({
      id: r.id, productId: r.productId, variantId: r.variantId, type: r.type, quantity: r.quantity,
      note: r.note, reference: r.reference, createdAt: r.createdAt,
      product: { name: r.productName, sku: r.productSku, unit: r.productUnit, color: r.productColor },
      variantSize: r.variantSize,
    }));

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, type, customerName, note } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'Entries are required' }, { status: 400 });
    }

    if (type === 'OUT') {
      // Validate stock before processing
      for (const entry of entries) {
        if (entry.variantId) {
          const variants = await d1Query('SELECT stock, size FROM ProductVariant WHERE id = ?', [entry.variantId]);
          const variant = (variants as { stock: number; size: string }[])[0];
          if (!variant || variant.stock < entry.quantity) {
            return NextResponse.json(
              { error: `Stok ${variant?.size || ''} tidak cukup. Tersedia: ${variant?.stock || 0}` },
              { status: 400 }
            );
          }
        }
      }

      const receiptNumber = generateReceiptNumber();
      const receiptId = generateId();
      const now = new Date().toISOString();

      const totalAmount = entries.reduce(
        (sum: number, e: { price: number; quantity: number }) => sum + e.price * e.quantity, 0
      );

      await d1Query(
        'INSERT INTO Receipt (id, receiptNumber, customerName, totalAmount, note, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [receiptId, receiptNumber, customerName || null, totalAmount, note || null, now]
      );

      for (const entry of entries) {
        const itemId = generateId();
        const movementId = generateId();

        await d1Query(
          'INSERT INTO ReceiptItem (id, receiptId, productId, variantId, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [itemId, receiptId, entry.productId, entry.variantId || null, entry.quantity, entry.price, entry.price * entry.quantity]
        );

        await d1Query(
          'INSERT INTO StockMovement (id, productId, variantId, type, quantity, note, reference, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [movementId, entry.productId, entry.variantId || null, 'OUT', entry.quantity, entry.note || null, receiptNumber, now]
        );

        // Update variant stock
        if (entry.variantId) {
          await d1Query('UPDATE ProductVariant SET stock = stock - ?, updatedAt = ? WHERE id = ?',
            [entry.quantity, now, entry.variantId]);
        }
        // Update product total stock
        await d1Query('UPDATE Product SET stock = stock - ?, updatedAt = ? WHERE id = ?',
          [entry.quantity, now, entry.productId]);
      }

      const items = await d1Query(
        `SELECT ri.*, p.name as productName, p.unit as productUnit, pv.size as variantSize
         FROM ReceiptItem ri 
         JOIN Product p ON ri.productId = p.id
         LEFT JOIN ProductVariant pv ON ri.variantId = pv.id
         WHERE ri.receiptId = ?`, [receiptId]
      );

      interface ItemRow {
        id: string; receiptId: string; productId: string; variantId: string | null;
        quantity: number; price: number; subtotal: number;
        productName: string; productUnit: string; variantSize: string | null;
      }
      const formattedItems = (items as ItemRow[]).map(i => ({
        id: i.id, quantity: i.quantity, price: i.price, subtotal: i.subtotal,
        product: { name: i.productName, unit: i.productUnit },
        variantSize: i.variantSize,
      }));

      return NextResponse.json({
        receipt: {
          id: receiptId, receiptNumber, customerName: customerName || null,
          totalAmount, note: note || null, createdAt: now,
          items: formattedItems,
        },
        receiptNumber,
      }, { status: 201 });

    } else {
      // Stock IN
      const now = new Date().toISOString();
      for (const entry of entries) {
        const movementId = generateId();

        await d1Query(
          'INSERT INTO StockMovement (id, productId, variantId, type, quantity, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [movementId, entry.productId, entry.variantId || null, 'IN', entry.quantity, entry.note || null, now]
        );

        if (entry.variantId) {
          await d1Query('UPDATE ProductVariant SET stock = stock + ?, updatedAt = ? WHERE id = ?',
            [entry.quantity, now, entry.variantId]);
        }
        await d1Query('UPDATE Product SET stock = stock + ?, updatedAt = ? WHERE id = ?',
          [entry.quantity, now, entry.productId]);
      }

      return NextResponse.json({ success: true, count: entries.length }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 });
  }
}
