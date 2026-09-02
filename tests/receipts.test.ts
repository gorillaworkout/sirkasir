import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { groupReceiptItems } from '../src/lib/receipts';

const receipts = [
  { id: 'r2', receiptNumber: '002', customerName: null, totalAmount: 20, note: null, createdAt: '2026-01-02' },
  { id: 'r1', receiptNumber: '001', customerName: 'Bayu', totalAmount: 10, note: 'note', createdAt: '2026-01-01' },
];
const items = [
  { id: 'i1', receiptId: 'r1', productId: 'p1', quantity: 2, price: 5, subtotal: 10, productName: 'Shirt', productUnit: 'pcs', variantSize: 'L' },
];

test('preserves receipt order and response shape while grouping items', () => {
  assert.deepEqual(groupReceiptItems(receipts, items), [
    { ...receipts[0], items: [] },
    {
      ...receipts[1],
      items: [{
        id: 'i1', receiptId: 'r1', productId: 'p1', quantity: 2, price: 5, subtotal: 10,
        product: { name: 'Shirt', unit: 'pcs' }, variantSize: 'L',
      }],
    },
  ]);
});

test('receipt endpoint does not query items once per receipt', () => {
  const route = fs.readFileSync(path.join(process.cwd(), 'src/app/api/receipts/route.ts'), 'utf8');
  assert.doesNotMatch(route, /for \(const r of receipts/);
  assert.match(route, /groupReceiptItems/);
});
