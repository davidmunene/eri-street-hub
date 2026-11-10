'use client';

import Link from 'next/link';
import { useOptimistic, useState, useTransition } from 'react';
import { Clock } from 'lucide-react';
import { Avatar, Badge, cn } from '@/components/ui';
import { STAGES } from '@/lib/format';
import { changeStage } from '../beneficiaries/actions';

export type Card = { id: string; code: string; name: string; alias: string | null; photoUrl: string | null; stage: string; days: number; site: string | null; flags: string[]; missingDocs: boolean };

export default function PipelineBoard({ cards, canEdit }: { cards: Card[]; canEdit: boolean }) {
  const [items, move] = useOptimistic(cards, (state, { id, stage }: { id: string; stage: string }) => state.map((c) => (c.id === id ? { ...c, stage, days: 0 } : c)));
  const [, start] = useTransition();
  const [over, setOver] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const moveTo = (id: string, stage: string) => {
    const card = items.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    start(async () => {
      move({ id, stage });
      const r = await changeStage(id, stage);
      setToast(r.error ? { text: r.error, error: true } : { text: `${card.alias ?? card.name} → ${STAGES.find((s) => s.id === stage)?.label}` });
      setTimeout(() => setToast(null), 2500);
    });
  };

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <div className="grid min-w-[1100px] grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const col = items.filter((c) => c.stage === stage.id);
            return (
              <section
                key={stage.id}
                aria-label={stage.label}
                onDragOver={canEdit ? (e) => { e.preventDefault(); setOver(stage.id); } : undefined}
                onDragLeave={() => setOver(null)}
                onDrop={canEdit ? (e) => { e.preventDefault(); setOver(null); moveTo(e.dataTransfer.getData('text/plain'), stage.id); } : undefined}
                className={cn('flex flex-col rounded-xl border p-2.5 transition', over === stage.id ? 'border-brand-400 bg-brand-50' : 'border-transparent bg-slate-100/70')}
              >
                <header className="mb-2 px-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">{stage.label}</h2>
                    <span className="rounded-full bg-white px-2 text-xs font-semibold text-slate-600">{col.length}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{stage.description}</p>
                </header>
                <ul className="min-h-[200px] flex-1 space-y-2">
                  {col.map((c) => (
                    <li key={c.id} draggable={canEdit} onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                      className={cn('rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm', canEdit && 'cursor-grab active:cursor-grabbing')}>
                      <Link href={`/beneficiaries/${c.id}`} className="flex items-start gap-2" draggable={false}>
                        <Avatar name={c.alias ?? c.name} src={c.photoUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold hover:text-brand-700">{c.alias ?? c.name}</p>
                          <p className="truncate text-[11px] text-slate-500">{c.code}{c.site ? ` · ${c.site}` : ''}</p>
                        </div>
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge tone={c.days > 90 ? 'rose' : c.days > 45 ? 'amber' : 'slate'} className="!px-1.5 !text-[10px]"><Clock className="h-2.5 w-2.5" />{c.days}d</Badge>
                        {c.missingDocs ? <Badge tone="rose" className="!px-1.5 !text-[10px]">ID gap</Badge> : null}
                        {c.flags.slice(0, 2).map((f) => <Badge key={f} tone="amber" className="!px-1.5 !text-[10px]">{f}</Badge>)}
                      </div>
                      {canEdit ? (
                        <select aria-label={`Move ${c.alias ?? c.name}`} value={c.stage} onChange={(e) => moveTo(c.id, e.target.value)}
                          className="mt-2 w-full rounded-md border-0 bg-slate-50 py-1 pl-2 pr-7 text-[11px] text-slate-600 ring-1 ring-slate-200 focus:ring-brand-500">
                          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.id === c.stage ? 'Move to…' : s.label}</option>)}
                        </select>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
      {toast ? (
        <div role="status" className={cn('fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg', toast.error ? 'bg-rose-600' : 'bg-slate-900')}>{toast.text}</div>
      ) : null}
    </>
  );
}
