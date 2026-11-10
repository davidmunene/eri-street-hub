import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can, visibleAudiences } from '@/lib/permissions';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { stageLabel, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Search' };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser('dashboard:view');
  const q = (await searchParams).q?.trim().slice(0, 100) ?? '';
  if (!q) return <><PageHeader title="Search" /><EmptyState title="Type something in the search bar above" /></>;
  const ci = { contains: q, mode: 'insensitive' as const };
  const audiences = visibleAudiences(user.role);

  const [people, members, docs, notices, events] = await Promise.all([
    can(user.role, 'beneficiaries:view') ? prisma.beneficiary.findMany({ where: { OR: [{ legalName: ci }, { alias: ci }, { code: ci }] }, take: 10, select: { id: true, code: true, legalName: true, alias: true, stage: true } }) : [],
    can(user.role, 'members:view') ? prisma.user.findMany({ where: { status: 'ACTIVE', OR: [{ name: ci }, { position: ci }] }, take: 10, select: { id: true, name: true, position: true } }) : [],
    prisma.document.findMany({ where: { audience: { in: audiences }, OR: [{ title: ci }, { description: ci }] }, take: 10, select: { id: true, title: true, fileUrl: true, externalUrl: true } }),
    prisma.announcement.findMany({ where: { audience: { in: audiences }, OR: [{ title: ci }, { body: ci }] }, take: 10, select: { id: true, title: true, createdAt: true } }),
    prisma.event.findMany({ where: { OR: [{ title: ci }, { description: ci }] }, take: 10, orderBy: { startsAt: 'desc' }, select: { id: true, title: true, startsAt: true } }),
  ]);
  const groups = [
    { title: 'Beneficiaries', items: people.map((p) => ({ href: `/beneficiaries/${p.id}`, label: `${p.legalName}${p.alias ? ` “${p.alias}”` : ''}`, meta: `${p.code} · ${stageLabel(p.stage)}` })) },
    { title: 'Members', items: members.map((m) => ({ href: `/members/${m.id}`, label: m.name, meta: m.position ?? '' })) },
    { title: 'Documents', items: docs.map((d) => ({ href: d.fileUrl ?? d.externalUrl ?? '/documents', label: d.title, meta: '' })) },
    { title: 'Announcements', items: notices.map((n) => ({ href: `/announcements/${n.id}`, label: n.title, meta: formatDate(n.createdAt) })) },
    { title: 'Events', items: events.map((e) => ({ href: `/events/${e.id}`, label: e.title, meta: formatDate(e.startsAt) })) },
  ].filter((g) => g.items.length);

  return (
    <>
      <PageHeader title={`Results for “${q}”`} />
      {groups.length === 0 ? <EmptyState title="Nothing found" description="Try a different spelling or a shorter word." /> : (
        <div className="grid gap-6 md:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.title} title={g.title}>
              <ul className="divide-y divide-slate-100">
                {g.items.map((i) => <li key={i.href + i.label}><Link href={i.href} className="flex justify-between gap-3 py-2 text-sm hover:text-brand-700"><span className="font-medium">{i.label}</span><span className="text-xs text-slate-500">{i.meta}</span></Link></li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
