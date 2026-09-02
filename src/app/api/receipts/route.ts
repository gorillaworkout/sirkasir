import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';
import { groupReceiptItems, type ReceiptItemRow, type ReceiptRow } from '@/lib/receipts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');

    let sql = 'SELECT r.* FROM Receipt r';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (from) { conditions.push('r.createdAt >= ?'); params.push(new Date(from).toISOString()); }
    if (to) { conditions.push('r.createdAt <= ?'); params.push(new Date(to + 'T23:59:59.999Z').toISOString()); }
    
    if (status === 'LUNAS') {
      conditions.push("(r.paymentStatus = 'LUNAS' OR r.paymentStatus IS NULL)");
    } else if (status === 'BELUM_LUNAS') {
      conditions.push("(r.paymentStatus = 'DP' OR r.paymentStatus = 'TUNDA_BAYAR')");
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY r.createdAt DESC';

    const receipts = await d1Query(sql, params) as ReceiptRow[];
    if (receipts.length === 0) return NextResponse.json([]);

    let itemSql = `SELECT ri.*, p.name as productName, p.unit as productUnit, pv.size as variantSize
                   FROM ReceiptItem ri
                   JOIN Receipt r ON ri.receiptId = r.id
                   JOIN Product p ON ri.productId = p.id
                   LEFT JOIN ProductVariant pv ON ri.variantId = pv.id`;
    if (conditions.length > 0) {
      itemSql += ' WHERE ' + conditions.join(' AND ');
    }
    const items = await d1Query(itemSql, params) as ReceiptItemRow[];

    return NextResponse.json(groupReceiptItems(receipts, items));
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}
