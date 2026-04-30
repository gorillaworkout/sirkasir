import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let sql = 'SELECT * FROM Receipt';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (from) { conditions.push('createdAt >= ?'); params.push(new Date(from).toISOString()); }
    if (to) { conditions.push('createdAt <= ?'); params.push(new Date(to + 'T23:59:59.999Z').toISOString()); }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY createdAt DESC';

    const receipts = await d1Query(sql, params);

    // Fetch items for each receipt
    interface Receipt {
      id: string; receiptNumber: string; customerName: string | null;
      totalAmount: number; note: string | null; createdAt: string;
    }
    const result = [];
    for (const r of receipts as Receipt[]) {
      const items = await d1Query(
        `SELECT ri.*, p.name as productName, p.unit as productUnit
         FROM ReceiptItem ri JOIN Product p ON ri.productId = p.id
         WHERE ri.receiptId = ?`, [r.id]
      );

      interface ItemRow {
        id: string; receiptId: string; productId: string; quantity: number;
        price: number; subtotal: number; productName: string; productUnit: string;
      }
      result.push({
        ...r,
        items: (items as ItemRow[]).map(i => ({
          id: i.id, receiptId: i.receiptId, productId: i.productId,
          quantity: i.quantity, price: i.price, subtotal: i.subtotal,
          product: { name: i.productName, unit: i.productUnit },
        })),
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}
