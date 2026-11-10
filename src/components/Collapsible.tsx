'use client';

import { useState, type ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { buttonClass } from '@/components/ui';

/** A "New …" button that expands into an inline form card. */
export default function Collapsible({ label, title, children }: { label: string; title?: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={buttonClass('primary')}>
        <Plus className="h-4 w-4" /> {label}
      </button>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title ?? label}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{title ?? label}</h2>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children(() => setOpen(false))}</div>
      </div>
    </div>
  );
}
