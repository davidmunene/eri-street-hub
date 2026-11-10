import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, HeartHandshake, UserPlus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Avatar, Badge, EmptyState, LinkButton, PageHeader, Table, buttonClass, inputClass, td } from '@/components/ui';
import { STAGES, ageFrom, daysSince, stageLabel } from '@/lib/format';
import { STAGE_TONES } from './constants';
import { beneficiaryWhere, type BeneficiaryFilters } from './query';

export const metadata: Metadata = { title: 'Beneficiaries' };
const PAGE_SIZE = 25;

export default async function BeneficiariesPage({ searchParams }: { searchParams: Promise<BeneficiaryFilters> }) {
  const user = await requireUser('beneficiaries:view');
  const f = await searchParams;
  const page = Math.max(1, Number(f.page) || 1);
  const where = beneficiaryWhere(f);

  const [rows, total, sites] = await Promise.all([
    prisma.beneficiary.findMany({
      where, orderBy: { intakeDate: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { site: true, caseworker: { select: { name: true } }, idDocuments: { select: { type: true, status: true } } },
    }),
    prisma.beneficiary.count({ where }),
    prisma.site.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const params = new URLSearchParams(Object.entries({ ...f, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `/beneficiaries?${params}`;
  };
  const exportQs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== 'page') as [string, string][]);

  return (
    <>
      <PageHeader title="Beneficiaries" description="Everyone in the Eri Street programme, with their case status and documentation."
        actions={
          <>
            <a href={`/beneficiaries/export?${exportQs}`} className={buttonClass('secondary')}><Download className="h-4 w-4" /> Export</a>
            {can(user.role, 'beneficiaries:manage') ? <LinkButton href="/beneficiaries/new" variant="success"><UserPlus className="h-4 w-4" /> New intake</LinkButton> : null}
          </>
        } />

      <form className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-surface p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={f.q} placeholder="Name, alias or case no." aria-label="Search" className={`${inputClass} lg:col-span-2`} />
        <select name="stage" defaultValue={f.stage ?? ''} aria-label="Stage" className={inputClass}><option value="">All stages</option>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        <select name="site" defaultValue={f.site ?? ''} aria-label="Site" className={inputClass}><option value="">All sites</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select name="status" defaultValue={f.status ?? ''} aria-label="Status" className={inputClass}>
          <option value="">Active & on hold</option><option value="ACTIVE">Active only</option><option value="ON_HOLD">On hold</option><option value="EXITED">Exited</option><option value="ALL">Everyone</option>
        </select>
        <div className="flex gap-2">
          <select name="docs" defaultValue={f.docs ?? ''} aria-label="Documents" className={inputClass}><option value="">Any documents</option><option value="missing">Missing ID docs</option></select>
          <button className={buttonClass('primary')}>Filter</button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No beneficiaries found" description={f.q || f.stage || f.site ? 'Try clearing some filters.' : 'Start by registering someone through the intake form.'} icon={<HeartHandshake className="h-8 w-8" />}
          action={can(user.role, 'beneficiaries:manage') ? <LinkButton href="/beneficiaries/new" variant="success">New intake</LinkButton> : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm">
          <Table head={['Person', 'Stage', 'Site', 'Documents', 'Caseworker', 'In programme']}>
            {rows.map((b) => {
              const bc = b.idDocuments.find((d) => d.type === 'BIRTH_CERTIFICATE')?.status;
              const nid = b.idDocuments.find((d) => d.type === 'NATIONAL_ID')?.status;
              const age = ageFrom(b.dateOfBirth, b.estimatedAge);
              return (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/beneficiaries/${b.id}`} className="flex items-center gap-3">
                      <Avatar name={b.alias ?? b.legalName} src={b.photoUrl} />
                      <span>
                        <span className="block font-semibold text-slate-900 hover:text-brand-700">{b.legalName}{b.alias ? <span className="font-normal text-slate-500"> “{b.alias}”</span> : null}</span>
                        <span className="block text-xs text-slate-500">{b.code}{age != null ? ` · ${age} yrs` : ''}{b.status !== 'ACTIVE' ? ` · ${b.status === 'ON_HOLD' ? 'On hold' : 'Exited'}` : ''}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={td}><Badge tone={STAGE_TONES[b.stage]}>{stageLabel(b.stage)}</Badge></td>
                  <td className={td}>{b.site?.name ?? '—'}</td>
                  <td className={td}>
                    <div className="flex gap-1">
                      <Badge tone={bc === 'OBTAINED' ? 'leaf' : bc === 'IN_PROCESS' ? 'amber' : 'rose'}>Birth cert.</Badge>
                      <Badge tone={nid === 'OBTAINED' ? 'leaf' : nid === 'IN_PROCESS' ? 'amber' : 'rose'}>ID</Badge>
                    </div>
                  </td>
                  <td className={td}>{b.caseworker?.name ?? '—'}</td>
                  <td className={`${td} tabular-nums`}>{daysSince(b.intakeDate)} days</td>
                </tr>
              );
            })}
          </Table>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-2">
              {page > 1 ? <Link href={qs(page - 1)} className={buttonClass('secondary', 'sm')}>Previous</Link> : null}
              {page < pages ? <Link href={qs(page + 1)} className={buttonClass('secondary', 'sm')}>Next</Link> : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
