import type { Metadata } from 'next';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PERMISSIONS, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/permissions';
import { Card, PageHeader, StatCard, Table, buttonClass, cn, inputClass, td } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { formatDate } from '@/lib/format';
import SiteForm from './SiteForm';
import { deleteSite } from './actions';
import type { Role } from '@prisma/client';

export const metadata: Metadata = { title: 'Administration' };
const TABS = [['overview', 'Overview'], ['sites', 'Sites'], ['audit', 'Audit log'], ['roles', 'Roles & permissions']] as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; page?: string }> }) {
  await requireUser('admin:access');
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : 'overview';

  return (
    <>
      <PageHeader title="Administration" description="System settings, operating sites and the accountability trail." />
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin?tab=${k}`} className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium', tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}>{l}</Link>
        ))}
      </nav>
      {tab === 'overview' ? <Overview /> : tab === 'sites' ? <Sites /> : tab === 'audit' ? <Audit q={sp.q} page={Number(sp.page) || 1} /> : <Roles />}
    </>
  );
}

async function Overview() {
  const [users, inactive, mustChange, beneficiaries, docs, events, tx] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], where: { status: 'ACTIVE' }, _count: true }),
    prisma.user.count({ where: { status: 'INACTIVE' } }),
    prisma.user.count({ where: { mustChangePassword: true, status: 'ACTIVE' } }),
    prisma.beneficiary.count(), prisma.document.count(), prisma.event.count(), prisma.transaction.count(),
  ]);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Beneficiary records" value={beneficiaries} />
        <StatCard label="Documents" value={docs} />
        <StatCard label="Events" value={events} />
        <StatCard label="Transactions" value={tx} />
      </div>
      <Card title="Accounts" actions={<Link href="/members?inactive=1" className="text-sm font-medium text-brand-600 hover:underline">Manage members</Link>}>
        <div className="grid gap-4 sm:grid-cols-5">
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <div key={r}><p className="text-2xl font-bold">{users.find((u) => u.role === r)?._count ?? 0}</p><p className="text-sm text-slate-500">{ROLE_LABELS[r]}s</p></div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">{inactive} inactive accounts · {mustChange} people have not yet set their own password.</p>
      </Card>
    </div>
  );
}

async function Sites() {
  const sites = await prisma.site.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { beneficiaries: true, users: true } } } });
  return (
    <Card title="Operating sites" description="Locations used across beneficiaries, members, events and partners.">
      <ul className="divide-y divide-slate-100">
        {sites.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3">
            <div><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.description ?? ''} {s._count.beneficiaries} beneficiaries · {s._count.users} members</p></div>
            <InlineAction action={deleteSite} hidden={{ id: s.id }} confirm={`Remove ${s.name}? Records linked to it will keep existing without a site.`}>
              <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${s.name}`}><Trash2 className="h-4 w-4" /></button>
            </InlineAction>
          </li>
        ))}
      </ul>
      <SiteForm />
    </Card>
  );
}

async function Audit({ q, page }: { q?: string; page: number }) {
  const where = q ? { OR: [{ summary: { contains: q, mode: 'insensitive' as const } }, { action: { contains: q, mode: 'insensitive' as const } }] } : {};
  const take = 50;
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take, include: { actor: { select: { name: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  return (
    <Card title="Audit log" description="Every important change: who did what, and when. Entries cannot be edited." padded={false}
      actions={<form className="flex gap-2"><input type="hidden" name="tab" value="audit" /><input name="q" defaultValue={q} placeholder="Filter…" aria-label="Filter audit log" className={`${inputClass} w-48 py-1.5`} /><button className={buttonClass('secondary', 'sm')}>Go</button></form>}>
      <Table head={['When', 'Action', 'Summary']}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className={`${td} text-xs`}>{formatDate(r.createdAt, true)}</td>
            <td className={`${td} font-mono text-xs`}>{r.action}</td>
            <td className="px-4 py-3 text-slate-700">{r.summary}</td>
          </tr>
        ))}
      </Table>
      <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
        <span>{total} entries</span>
        <div className="flex gap-2">
          {page > 1 ? <Link className={buttonClass('secondary', 'sm')} href={`/admin?tab=audit&page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>Newer</Link> : null}
          {page * take < total ? <Link className={buttonClass('secondary', 'sm')} href={`/admin?tab=audit&page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>Older</Link> : null}
        </div>
      </div>
    </Card>
  );
}

function Roles() {
  const roles = Object.keys(ROLE_LABELS) as Role[];
  return (
    <Card title="What each role can do" description="Permissions are enforced on the server for every page and action." padded={false}>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
        {roles.map((r) => <div key={r}><p className="font-semibold">{ROLE_LABELS[r]}</p><p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[r]}</p></div>)}
      </div>
      <Table head={['Permission', ...roles.map((r) => ROLE_LABELS[r])]}>
        {Object.entries(PERMISSIONS).map(([perm, allowed]) => (
          <tr key={perm}>
            <td className={`${td} font-mono text-xs`}>{perm}</td>
            {roles.map((r) => <td key={r} className="px-4 py-2 text-center">{(allowed as readonly string[]).includes(r) ? <span className="text-leaf-600" aria-label="Allowed">●</span> : <span className="text-slate-200" aria-label="Not allowed">○</span>}</td>)}
          </tr>
        ))}
      </Table>
    </Card>
  );
}
