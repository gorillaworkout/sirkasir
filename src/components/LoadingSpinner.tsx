'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Memuat...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
