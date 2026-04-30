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
      todayMovementRows,
      todayReceiptRows,
      lowStockRows,
    ] = await Promise.all([
      d1Query('SELECT COUNT(*) as count FROM Product'),
      d1Query('SELECT COUNT(*) as count FROM StockMovement WHERE createdAt >= ? AND createdAt < ?', [todayStr, tomorrowStr]),
      d1Query('SELECT totalAmount FROM Receipt WHERE createdAt >= ? AND createdAt < ?', [todayStr, tomorrowStr]),
      d1Query('SELECT p.id, p.name, p.color, p.unit, p.minStock, COALESCE(SUM(pv.stock), 0) as totalStock FROM Product p LEFT JOIN ProductVariant pv ON pv.productId = p.id GROUP BY p.id HAVING totalStock > 0 AND totalStock <= p.minStock'),
    ]);

    // Calculate stock value from variants (each size has own price)
    const allVariants = await d1Query('SELECT stock, price, costPrice FROM ProductVariant') as { stock: number; price: number; costPrice: number }[];
    const totalStockValue = allVariants.reduce((sum, v) => sum + v.stock * v.costPrice, 0);

    // Recent movements with product + variant info
    const recentMovements = await d1Query(
      `SELECT sm.id, sm.type, sm.quantity, sm.note, sm.reference, sm.createdAt, 
              p.name as productName, p.unit as productUnit, p.color as productColor,
              pv.size as variantSize
       FROM StockMovement sm 
       JOIN Product p ON sm.productId = p.id
       LEFT JOIN ProductVariant pv ON sm.variantId = pv.id
       ORDER BY sm.createdAt DESC LIMIT 10`
    );

    // Out of stock: products where ALL variants have 0 stock
    const outOfStockRows = await d1Query(
      'SELECT COUNT(*) as count FROM Product p WHERE (SELECT COALESCE(SUM(pv.stock), 0) FROM ProductVariant pv WHERE pv.productId = p.id) <= 0'
    );

    const totalProducts = (countRows as { count: number }[])[0]?.count || 0;
    const outOfStockCount = (outOfStockRows as { count: number }[])[0]?.count || 0;
    const todayTransactions = (todayMovementRows as { count: number }[])[0]?.count || 0;

    const todayRevenue = (todayReceiptRows as { totalAmount: number }[]).reduce(
      (sum, r) => sum + r.totalAmount, 0
    );

    interface MovementRow {
      id: string; type: string; quantity: number; note: string | null;
      reference: string | null; createdAt: string;
      productName: string; productUnit: string; productColor: string | null;
      variantSize: string | null;
    }
    const formattedMovements = (recentMovements as MovementRow[]).map(m => ({
      id: m.id, type: m.type, quantity: m.quantity,
      note: m.note, reference: m.reference, createdAt: m.createdAt,
      product: { name: m.productName, unit: m.productUnit, color: m.productColor },
      variantSize: m.variantSize,
    }));

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
