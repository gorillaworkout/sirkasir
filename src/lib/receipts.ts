export interface ReceiptRow {
  id: string;
  receiptNumber: string;
  customerName: string | null;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface ReceiptItemRow {
  id: string;
  receiptId: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  productName: string;
  productUnit: string;
  variantSize: string | null;
}

export function groupReceiptItems(receipts: ReceiptRow[], items: ReceiptItemRow[]) {
  const byReceipt = new Map<string, ReturnType<typeof toReceiptItem>[]>();

  for (const item of items) {
    const grouped = byReceipt.get(item.receiptId) ?? [];
    grouped.push(toReceiptItem(item));
    byReceipt.set(item.receiptId, grouped);
  }

  return receipts.map(receipt => ({
    ...receipt,
    items: byReceipt.get(receipt.id) ?? [],
  }));
}

function toReceiptItem(item: ReceiptItemRow) {
  return {
    id: item.id,
    receiptId: item.receiptId,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    product: { name: item.productName, unit: item.productUnit },
    variantSize: item.variantSize,
  };
}
