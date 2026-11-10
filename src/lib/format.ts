import type { Stage } from '@prisma/client';

export const STAGES: { id: Stage; label: string; short: string; description: string }[] = [
  { id: 'HELPING_HAND', label: 'Helping Hand', short: 'Helping Hand', description: 'First contact, food, trust building' },
  { id: 'IDENTIFICATION', label: 'Identification', short: 'ID', description: 'Birth certificate, national ID, SHA' },
  { id: 'ACCESS_REHABILITATION', label: 'Access & Rehabilitation', short: 'Rehab', description: 'Healthcare, rehab, counselling' },
  { id: 'REINTEGRATION', label: 'Reintegration', short: 'Reintegration', description: 'Family tracing, school, skills' },
  { id: 'RESOCIALIZATION', label: 'Resocialization', short: 'Resocial.', description: 'Livelihoods & community life' },
  { id: 'GRADUATED', label: 'Graduated', short: 'Graduated', description: 'Independent and stable' },
];

export const stageLabel = (s: Stage) => STAGES.find((x) => x.id === s)?.label ?? s;

/** "NEEDS_FOLLOW_UP" → "Needs follow up" */
export function humanize(value: string): string {
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const kes = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
export const formatKES = (n: number) => kes.format(n);

export function formatDate(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Africa/Nairobi',
  }).format(new Date(d));
}

export function timeAgo(d: Date | string, now = new Date()): string {
  const secs = Math.round((now.getTime() - new Date(d).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function daysSince(d: Date | string, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(d).getTime()) / 86_400_000));
}

export function ageFrom(dob: Date | null, estimated: number | null, now = new Date()): number | null {
  if (dob) {
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  }
  return estimated;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Value for <input type="datetime-local"> in Nairobi time. */
export function toDateTimeLocal(d: Date | null | undefined): string {
  if (!d) return '';
  const local = new Date(d.getTime() + 3 * 3600_000); // EAT = UTC+3, no DST
  return local.toISOString().slice(0, 16);
}
export function toDateInput(d: Date | null | undefined): string {
  return d ? toDateTimeLocal(d).slice(0, 10) : '';
}
/** Parses a datetime-local / date string as Nairobi time. */
export function parseNairobi(value: string): Date {
  return new Date(value.length <= 10 ? `${value}T00:00:00+03:00` : `${value}:00+03:00`);
}

export function beneficiaryCode(n: number): string {
  return `ESI-${String(n).padStart(4, '0')}`;
}

export function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  // Prefix formula-like values to prevent CSV injection in spreadsheet apps.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
