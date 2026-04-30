import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const receipts = await d1Query('SELECT * FROM Receipt WHERE id = ?', [id]);
    const receipt = (receipts as Record<string, unknown>[])[0];

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const items = await d1Query(
      `SELECT ri.*, p.name as productName, p.unit as productUnit, p.sku as productSku, pv.size as variantSize
       FROM ReceiptItem ri 
       JOIN Product p ON ri.productId = p.id
       LEFT JOIN ProductVariant pv ON ri.variantId = pv.id
       WHERE ri.receiptId = ?`, [id]
    );

    interface ItemRow {
      id: string; receiptId: string; productId: string; variantId: string | null;
      quantity: number; price: number; subtotal: number;
      productName: string; productUnit: string; productSku: string; variantSize: string | null;
    }

    return NextResponse.json({
      ...receipt,
      items: (items as ItemRow[]).map(i => ({
        id: i.id, receiptId: i.receiptId, productId: i.productId,
        quantity: i.quantity, price: i.price, subtotal: i.subtotal,
        product: { name: i.productName, unit: i.productUnit, sku: i.productSku },
        variantSize: i.variantSize,
      })),
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}
