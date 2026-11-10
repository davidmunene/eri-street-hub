import type { Metadata } from 'next';
import Link from 'next/link';
import type { InterventionType, Prisma } from '@prisma/client';
import { ClipboardList, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Badge, EmptyState, PageHeader, StatCard, buttonClass, inputClass } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { formatDate, humanize, parseNairobi, toDateInput } from '@/lib/format';
import NewReport from './NewReport';
import { deleteFieldReport } from './actions';

export const metadata: Metadata = { title: 'Field reports' };
const TYPES = ['FOOD', 'HEALTH', 'DOCUMENTATION', 'COUNSELLING', 'EDUCATION', 'SHELTER', 'LIVELIHOOD', 'REFERRAL', 'OTHER'];
const OUTCOME_TONE = { SUCCESS: 'leaf', IN_PROGRESS: 'sky', NEEDS_FOLLOW_UP: 'amber', CRITICAL: 'rose' } as const;

export default async function FieldReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; new?: string; beneficiary?: string }> }) {
  const user = await requireUser('beneficiaries:view');
  const sp = await searchParams;
  const where: Prisma.FieldReportWhereInput = sp.type && TYPES.includes(sp.type) ? { type: sp.type as InterventionType } : {};
  const monthStart = parseNairobi(`${toDateInput(new Date()).slice(0, 7)}-01`);
  const manage = can(user.role, 'reports:manage');

  const [reports, sites, people, monthAgg, followUps] = await Promise.all([
    prisma.fieldReport.findMany({ where, orderBy: { date: 'desc' }, take: 100, include: { site: true, staff: { select: { name: true } }, beneficiaries: { select: { id: true, code: true, alias: true, legalName: true } } } }),
    prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    manage ? prisma.beneficiary.findMany({ where: { status: { not: 'EXITED' } }, orderBy: { code: 'asc' }, select: { id: true, code: true, legalName: true, alias: true } }) : [],
    prisma.fieldReport.aggregate({ where: { date: { gte: monthStart } }, _count: true, _sum: { peopleReached: true } }),
    prisma.fieldReport.count({ where: { outcome: { in: ['NEEDS_FOLLOW_UP', 'CRITICAL'] }, date: { gte: new Date(Date.now() - 30 * 86_400_000) } } }),
  ]);

  return (
    <>
      <PageHeader title="Field reports" description="Every outreach and intervention: what we did, where, and who we reached."
        actions={manage ? <NewReport sites={sites} today={toDateInput(new Date())} preselect={sp.beneficiary} autoOpen={!!sp.new}
          people={people.map((p) => ({ id: p.id, label: `${p.code} · ${p.legalName}${p.alias ? ` (${p.alias})` : ''}` }))} /> : null} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Reports this month" value={monthAgg._count} />
        <StatCard label="People reached this month" value={(monthAgg._sum.peopleReached ?? 0).toLocaleString()} tone="leaf" />
        <StatCard label="Need follow-up (30 days)" value={followUps} tone={followUps ? 'amber' : 'brand'} />
      </div>

      <form className="mb-4 flex gap-2">
        <select name="type" defaultValue={sp.type ?? ''} aria-label="Type" className={`${inputClass} w-48`}><option value="">All types</option>{TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}</select>
        <button className={buttonClass('secondary')}>Filter</button>
      </form>

      {reports.length === 0 ? <EmptyState title="No field reports yet" icon={<ClipboardList className="h-8 w-8" />} /> : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{humanize(r.type)}</Badge>
                <Badge tone={OUTCOME_TONE[r.outcome]}>{humanize(r.outcome)}</Badge>
                <span className="text-xs text-slate-500">{formatDate(r.date)} · {r.site?.name ?? 'No site'} · {r.staff.name}{r.peopleReached ? ` · ${r.peopleReached} reached` : ''}</span>
                {manage ? (
                  <InlineAction action={deleteFieldReport} hidden={{ id: r.id }} confirm="Delete this report?" className="ml-auto">
                    <button className="rounded p-1 text-slate-300 hover:text-rose-600" aria-label="Delete report"><Trash2 className="h-4 w-4" /></button>
                  </InlineAction>
                ) : null}
              </div>
              <p className="prose-text mt-2">{r.summary}</p>
              {r.beneficiaries.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.beneficiaries.map((b) => <Link key={b.id} href={`/beneficiaries/${b.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-brand-50 hover:text-brand-700">{b.alias ?? b.legalName.split(' ')[0]} · {b.code}</Link>)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
