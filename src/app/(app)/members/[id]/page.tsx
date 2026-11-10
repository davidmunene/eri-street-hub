import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, CalendarCheck2, KanbanSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can, ROLE_LABELS } from '@/lib/permissions';
import { Avatar, Badge, Card, StatCard } from '@/components/ui';
import { formatDate, formatKES, timeAgo } from '@/lib/format';
import MemberForm, { ResetPasswordForm } from '../MemberForm';

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser('members:view');
  const { id } = await params;
  const admin = can(me.role, 'members:manage');
  const m = await prisma.user.findUnique({ where: { id }, include: { site: true } });
  if (!m || (m.status === 'INACTIVE' && !admin)) notFound();

  const [openTasks, attended, contributions, sites] = await Promise.all([
    prisma.task.findMany({ where: { assigneeId: id, status: { not: 'DONE' } }, orderBy: { dueDate: 'asc' }, take: 8 }),
    prisma.eventRsvp.count({ where: { userId: id, attended: true } }),
    can(me.role, 'finance:view') || me.id === id
      ? prisma.transaction.aggregate({ where: { memberId: id, type: 'INCOME' }, _sum: { amount: true }, _count: true })
      : null,
    admin ? prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }) : [],
  ]);

  return (
    <div>
      <Link href="/members" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Members</Link>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:row-span-2">
          <div className="flex flex-col items-center text-center">
            <Avatar name={m.name} src={m.image} size="lg" />
            <h1 className="mt-3 text-xl font-bold">{m.name}</h1>
            <p className="text-sm text-slate-600">{m.position ?? ROLE_LABELS[m.role]}</p>
            <div className="mt-2 flex gap-1.5"><Badge tone="brand">{ROLE_LABELS[m.role]}</Badge>{m.status === 'INACTIVE' ? <Badge tone="rose">Inactive</Badge> : null}</div>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><a href={`mailto:${m.email}`} className="truncate text-brand-700 hover:underline">{m.email}</a></div>
            {m.phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><a href={`tel:${m.phone}`} className="text-brand-700 hover:underline">{m.phone}</a></div> : null}
            {m.site ? <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{m.site.name}</div> : null}
          </dl>
          {m.bio ? <p className="prose-text mt-5 border-t border-slate-100 pt-5">{m.bio}</p> : null}
          {m.skills.length ? (
            <div className="mt-5 flex flex-wrap gap-1.5">{m.skills.map((s) => <Badge key={s} tone="sky">{s}</Badge>)}</div>
          ) : null}
          <p className="mt-6 text-xs text-slate-400">Member since {formatDate(m.joinedAt)}{admin && m.lastLoginAt ? ` · last seen ${timeAgo(m.lastLoginAt)}` : ''}</p>
          {admin ? (
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
              <MemberForm sites={sites} member={m} />
              <ResetPasswordForm id={m.id} />
            </div>
          ) : null}
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard label="Events attended" value={attended} icon={<CalendarCheck2 className="h-5 w-5" />} />
          {contributions ? <StatCard label="Contributions recorded" value={formatKES(contributions._sum.amount ?? 0)} hint={`${contributions._count} payments`} tone="leaf" /> : <StatCard label="Open tasks" value={openTasks.length} icon={<KanbanSquare className="h-5 w-5" />} tone="amber" />}
        </div>

        <Card title="Open tasks" className="lg:col-span-2">
          {openTasks.length ? (
            <ul className="divide-y divide-slate-100">
              {openTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{t.title}</span>
                  <span className="text-xs text-slate-500">{t.dueDate ? `Due ${formatDate(t.dueDate)}` : 'No due date'}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No open tasks.</p>}
        </Card>
      </div>
    </div>
  );
}
