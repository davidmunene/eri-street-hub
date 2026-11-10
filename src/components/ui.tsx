import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { initials } from '@/lib/format';

export const cn = clsx;

// ── Buttons ─────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
  success: 'bg-leaf-600 text-white hover:bg-leaf-700 shadow-sm',
  secondary: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-white text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50',
};
export function buttonClass(variant: Variant = 'primary', size: 'sm' | 'md' = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60',
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
    variants[variant],
  );
}
export function Button({ variant = 'primary', size = 'md', className, ...props }: ComponentProps<'button'> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}
export function LinkButton({ variant = 'primary', size = 'md', className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

// ── Layout ──────────────────────────────────────────────
export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ className, children, title, description, actions, padded = true }: { className?: string; children: ReactNode; title?: ReactNode; description?: string; actions?: ReactNode; padded?: boolean }) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon, tone = 'brand' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: 'brand' | 'leaf' | 'amber' | 'rose' }) {
  const tones = { brand: 'bg-brand-50 text-brand-700', leaf: 'bg-leaf-50 text-leaf-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon ? <span className={cn('rounded-lg p-2', tones[tone])}>{icon}</span> : null}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-slate-400">{icon}</div> : null}
      <p className="font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

// ── Badges & avatars ────────────────────────────────────
const badgeTones = {
  slate: 'bg-slate-100 text-slate-700', brand: 'bg-brand-50 text-brand-700', leaf: 'bg-leaf-50 text-leaf-700',
  amber: 'bg-amber-50 text-amber-800', rose: 'bg-rose-50 text-rose-700', sky: 'bg-sky-50 text-sky-700', violet: 'bg-violet-50 text-violet-700',
};
export type Tone = keyof typeof badgeTones;
export function Badge({ children, tone = 'slate', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', badgeTones[tone], className)}>{children}</span>;
}

export function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-16 w-16 text-lg' }[size];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn('flex-none rounded-full object-cover ring-2 ring-white', s)} />;
  }
  return <span aria-hidden className={cn('inline-flex flex-none items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white', s)}>{initials(name)}</span>;
}

// ── Form fields ─────────────────────────────────────────
export const inputClass =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 disabled:bg-slate-50';

export function Field({ label, name, hint, error, children, required, className }: { label: string; name?: string; hint?: string; error?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Input(props: ComponentProps<'input'>) {
  return <input id={props.name} {...props} className={cn(inputClass, props.className)} />;
}
export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea id={props.name} rows={4} {...props} className={cn(inputClass, props.className)} />;
}
export function Select({ options, placeholder, ...props }: ComponentProps<'select'> & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select id={props.name} {...props} className={cn(inputClass, 'pr-8', props.className)}>
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
export function Checkbox({ label, description, ...props }: ComponentProps<'input'> & { label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" {...props} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}
export const td = 'whitespace-nowrap px-4 py-3 text-slate-700';
