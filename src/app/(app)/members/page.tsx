import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma, Role } from '@prisma/client';
import { Mail, Phone, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can, ROLE_LABELS } from '@/lib/permissions';
import { Avatar, Badge, EmptyState, PageHeader, inputClass } from '@/components/ui';
import MemberForm from './MemberForm';

export const metadata: Metadata = { title: 'Members' };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; inactive?: string }> }) {
  const user = await requireUser('members:view');
  const { q, role, inactive } = await searchParams;
  const admin = can(user.role, 'members:manage');
  const where: Prisma.UserWhereInput = {
    ...(admin && inactive ? {} : { status: 'ACTIVE' }),
    ...(role && role in ROLE_LABELS ? { role: role as Role } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { position: { contains: q, mode: 'insensitive' } }, { skills: { has: q } }] } : {}),
  };
  const [members, sites] = await Promise.all([
    prisma.user.findMany({ where, orderBy: [{ role: 'asc' }, { name: 'asc' }], include: { site: true } }),
    prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Members" description={`${members.length} people in the Eri Street family. Find who does what, and how to reach them.`}
        actions={admin ? <MemberForm sites={sites} /> : null} />
      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Search name, position or skill…" aria-label="Search members" className={`${inputClass} sm:max-w-xs`} />
        <select name="role" defaultValue={role ?? ''} aria-label="Filter by role" className={`${inputClass} sm:w-48`}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {admin ? <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="inactive" value="1" defaultChecked={!!inactive} className="rounded border-slate-300 text-primary" /> Include inactive</label> : null}
        <button className="rounded-lg bg-surface px-4 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">Filter</button>
      </form>
      {members.length === 0 ? <EmptyState title="No members match" icon={<Users className="h-8 w-8" />} /> : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => (
            <li key={m.id}>
              <Link href={`/members/${m.id}`} className="flex h-full gap-4 rounded-xl border border-slate-200 bg-surface p-5 shadow-sm transition hover:border-brand-200 hover:shadow">
                <Avatar name={m.name} src={m.image} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="truncate text-sm text-slate-600">{m.position ?? ROLE_LABELS[m.role]}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={m.role === 'ADMIN' ? 'violet' : m.role === 'OFFICIAL' ? 'brand' : m.role === 'STAFF' ? 'leaf' : 'slate'}>{ROLE_LABELS[m.role]}</Badge>
                    {m.site ? <Badge>{m.site.name}</Badge> : null}
                    {m.status === 'INACTIVE' ? <Badge tone="rose">Inactive</Badge> : null}
                  </div>
                  <div className="mt-3 space-y-0.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5" />{m.email}</p>
                    {m.phone ? <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{m.phone}</p> : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
