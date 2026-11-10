'use client';

import { useState } from 'react';
import { cn } from '@/components/ui';
import { formatKES } from '@/lib/format';

// Formatters are chosen by name: functions can't be passed from server to client components.
export type Unit = 'count' | 'kes';
const FORMATS: Record<Unit, (n: number) => string> = { count: (n) => n.toLocaleString(), kes: formatKES };

/**
 * Lightweight, dependency-free charts.
 * Every value is printed as text (never colour alone) and each mark has a
 * hover / keyboard-focus tooltip. A table view is offered for the multi-series chart.
 */

export function BarList({ data, unit = 'count', color = 'rgb(var(--chart-1))', emptyText = 'No data yet' }: {
  data: { label: string; value: number; hint?: string }[];
  unit?: Unit;
  color?: string;
  emptyText?: string;
}) {
  const format = FORMATS[unit];
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.some((d) => d.value > 0)) return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="group" title={d.hint ? `${d.label}: ${format(d.value)} — ${d.hint}` : `${d.label}: ${format(d.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-600">{d.label}</span>
            <span className="font-semibold tabular-nums text-slate-900">{format(d.value)}</span>
          </div>
          <div className="h-2.5 rounded bg-slate-100">
            <div
              className="h-2.5 rounded transition-[filter] group-hover:brightness-110"
              style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value > 0 ? 4 : 0, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export type MonthPoint = { month: string; income: number; expense: number };

const SERIES = [
  { key: 'income' as const, label: 'Income', color: 'rgb(var(--chart-1))' },
  { key: 'expense' as const, label: 'Expenses', color: 'rgb(var(--chart-2))' },
];

export function MonthlyBars({ data, unit = 'kes' }: { data: MonthPoint[]; unit?: Unit }) {
  const format = FORMATS[unit];
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const H = 160;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex gap-4 text-xs text-slate-600" aria-hidden>
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
        <button onClick={() => setTable((t) => !t)} className="text-xs font-medium text-brand-600 hover:underline">
          {table ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {table ? (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Month</th><th className="py-1 text-right">Income</th><th className="py-1 text-right">Expenses</th><th className="py-1 text-right">Net</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((d) => (
              <tr key={d.month}><td className="py-1.5">{d.month}</td><td className="text-right tabular-nums">{format(d.income)}</td><td className="text-right tabular-nums">{format(d.expense)}</td><td className="text-right font-medium tabular-nums">{format(d.income - d.expense)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <div className="flex items-end gap-2 border-b border-slate-200 sm:gap-4" style={{ height: H }}>
            {data.map((d, i) => (
              <div
                key={d.month}
                tabIndex={0}
                role="img"
                aria-label={`${d.month}: income ${format(d.income)}, expenses ${format(d.expense)}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={cn('flex h-full flex-1 items-end justify-center gap-[2px] rounded-t outline-none focus-visible:ring-2 focus-visible:ring-brand-500', active === i && 'bg-slate-50')}
              >
                {SERIES.map((s) => (
                  <div
                    key={s.key}
                    className="w-full max-w-[18px] rounded-t"
                    style={{ height: `${(d[s.key] / max) * 100}%`, minHeight: d[s.key] > 0 ? 3 : 0, background: s.color, opacity: active === null || active === i ? 1 : 0.55 }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2 sm:gap-4">
            {data.map((d) => <span key={d.month} className="flex-1 text-center text-[11px] text-slate-500">{d.month}</span>)}
          </div>
          {active !== null ? (
            <div
              className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-surface p-2.5 text-xs shadow-lg"
              style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
            >
              <p className="mb-1 font-semibold text-slate-900">{data[active].month}</p>
              {SERIES.map((s) => (
                <p key={s.key} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-3" style={{ background: s.color }} />{s.label}</span>
                  <strong className="tabular-nums text-slate-900">{format(data[active][s.key])}</strong>
                </p>
              ))}
              <p className="mt-1 flex justify-between border-t border-slate-100 pt-1 text-slate-600">Net <strong className="tabular-nums text-slate-900">{format(data[active].income - data[active].expense)}</strong></p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
