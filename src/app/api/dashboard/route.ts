import { NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = today.toISOString();
    const tomorrowStr = tomorrow.toISOString();

    const [
      countRows,
      outOfStockRows,
      todayMovementRows,
      allProductRows,
      todayReceiptRows,
      lowStockRows,
    ] = await Promise.all([
      d1Query('SELECT COUNT(*) as count FROM Product'),
      d1Query('SELECT COUNT(*) as count FROM Product WHERE stock <= 0'),
      d1Query('SELECT COUNT(*) as count FROM StockMovement WHERE createdAt >= ? AND createdAt < ?', [todayStr, tomorrowStr]),
      d1Query('SELECT stock, costPrice FROM Product'),
      d1Query('SELECT totalAmount FROM Receipt WHERE createdAt >= ? AND createdAt < ?', [todayStr, tomorrowStr]),
      d1Query('SELECT id, name, stock, minStock, unit FROM Product WHERE stock > 0 AND stock <= minStock'),
    ]);

    // Recent movements with product info via JOIN
    const recentMovements = await d1Query(
      `SELECT sm.id, sm.type, sm.quantity, sm.note, sm.reference, sm.createdAt, 
              p.name as productName, p.unit as productUnit
       FROM StockMovement sm 
       JOIN Product p ON sm.productId = p.id 
       ORDER BY sm.createdAt DESC LIMIT 10`
    );

    const totalProducts = countRows[0]?.count || 0;
    const outOfStockCount = outOfStockRows[0]?.count || 0;
    const todayTransactions = todayMovementRows[0]?.count || 0;

    const totalStockValue = (allProductRows as { stock: number; costPrice: number }[]).reduce(
      (sum: number, p: { stock: number; costPrice: number }) => sum + p.stock * p.costPrice, 0
    );

    const todayRevenue = (todayReceiptRows as { totalAmount: number }[]).reduce(
      (sum: number, r: { totalAmount: number }) => sum + r.totalAmount, 0
    );

    // Format recentMovements to match frontend expected shape
    const formattedMovements = (recentMovements as { id: string; type: string; quantity: number; note: string | null; reference: string | null; createdAt: string; productName: string; productUnit: string }[]).map(
      (m) => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        note: m.note,
        reference: m.reference,
        createdAt: m.createdAt,
        product: { name: m.productName, unit: m.productUnit },
      })
    );

    return NextResponse.json({
      totalProducts,
      lowStockCount: (lowStockRows as unknown[]).length,
      outOfStockCount,
      todayTransactions,
      totalStockValue,
      todayRevenue,
      recentMovements: formattedMovements,
      lowStockProducts: lowStockRows,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
