import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy', { locale: id });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id });
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RCPT-${dateStr}-${random}`;
}

export function getStockStatus(stock: number, minStock: number): 'ok' | 'low' | 'out' {
  if (stock <= 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'ok';
}

export function getStockStatusColor(status: 'ok' | 'low' | 'out'): string {
  switch (status) {
    case 'ok': return 'text-green-600 bg-green-50';
    case 'low': return 'text-yellow-600 bg-yellow-50';
    case 'out': return 'text-red-600 bg-red-50';
  }
}

export function getStockStatusLabel(status: 'ok' | 'low' | 'out'): string {
  switch (status) {
    case 'ok': return 'Stok Aman';
    case 'low': return 'Stok Rendah';
    case 'out': return 'Habis';
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
