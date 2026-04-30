import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Get stock movements with product info
    let movementSql = `SELECT sm.*, p.name as productName, p.sku as productSku, p.unit as productUnit, p.stock as productStock,
                        pv.size as variantSize
                        FROM StockMovement sm
                        JOIN Product p ON sm.productId = p.id
                        LEFT JOIN ProductVariant pv ON sm.variantId = pv.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (from) { conditions.push('sm.createdAt >= ?'); params.push(new Date(from).toISOString()); }
    if (to) { conditions.push('sm.createdAt <= ?'); params.push(new Date(to + 'T23:59:59.999Z').toISOString()); }

    if (conditions.length > 0) movementSql += ' WHERE ' + conditions.join(' AND ');
    movementSql += ' ORDER BY sm.createdAt DESC';

    const movementRows = await d1Query(movementSql, params);

    interface MovementRow {
      id: string; productId: string; type: string; quantity: number;
      note: string | null; reference: string | null; createdAt: string;
      productName: string; productSku: string; productUnit: string; productStock: number;
      variantSize: string | null;
    }

    const movements = (movementRows as MovementRow[]).map(r => ({
      id: r.id, productId: r.productId, type: r.type, quantity: r.quantity,
      note: r.note, reference: r.reference, createdAt: r.createdAt,
      product: { name: r.productName, sku: r.productSku, unit: r.productUnit, stock: r.productStock },
      variantSize: r.variantSize,
    }));

    // Get all products for summary
    const products = await d1Query(
      'SELECT id, name, sku, unit, stock, price, costPrice FROM Product'
    ) as { id: string; name: string; sku: string; unit: string; stock: number; price: number; costPrice: number }[];

    // Calculate summary per product
    const productSummary = products.map(product => {
      const productMovements = movements.filter(m => m.productId === product.id);
      const totalIn = productMovements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
      const totalOut = productMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);

      return {
        ...product,
        totalIn,
        totalOut,
        stockValue: product.stock * product.costPrice,
        sellValue: product.stock * product.price,
      };
    });

    const totalStockValue = productSummary.reduce((sum, p) => sum + p.stockValue, 0);
    const totalSellValue = productSummary.reduce((sum, p) => sum + p.sellValue, 0);
    const totalIn = movements.filter(m => m.type === 'IN').length;
    const totalOut = movements.filter(m => m.type === 'OUT').length;

    return NextResponse.json({
      movements,
      productSummary: productSummary.filter(p => p.totalIn > 0 || p.totalOut > 0),
      stats: {
        totalStockValue,
        totalSellValue,
        totalIn,
        totalOut,
        totalMovements: movements.length,
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
