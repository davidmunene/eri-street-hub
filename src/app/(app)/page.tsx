import Link from 'next/link';
import { CalendarDays, CalendarPlus, FileWarning, HeartHandshake, HeartPulse, Megaphone, MessageSquareHeart, Pin, UserPlus, Users, Wallet, GraduationCap, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can, visibleAudiences } from '@/lib/permissions';
import { Badge, Card, EmptyState, StatCard, Avatar, cn } from '@/components/ui';
import { BarList, MonthlyBars, type MonthPoint } from '@/components/charts';
import { STAGES, formatDate, formatKES, humanize, parseNairobi, timeAgo, toDateInput } from '@/lib/format';

export default async function DashboardPage() {
  const user = await requireUser('dashboard:view');
  const canFinance = can(user.role, 'finance:view');
  const canCases = can(user.role, 'beneficiaries:view');
  const canTasks = can(user.role, 'tasks:view');
  const now = new Date();
  const monthStart = parseNairobi(`${toDateInput(now).slice(0, 7)}-01`);

  const active = { status: { not: 'EXITED' as const } };
  const [
    memberCount, beneficiaryCount, newThisMonth, graduated, missingDocs, withHealthcare,
    byStage, sites, upcoming, notices, myTasks, activity,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.beneficiary.count({ where: active }),
    prisma.beneficiary.count({ where: { intakeDate: { gte: monthStart } } }),
    prisma.beneficiary.count({ where: { stage: 'GRADUATED' } }),
    prisma.beneficiary.count({ where: { ...active, idDocuments: { some: { type: { in: ['BIRTH_CERTIFICATE', 'NATIONAL_ID'] }, status: { not: 'OBTAINED' } } } } }),
    prisma.beneficiary.count({ where: { ...active, hasHealthcare: true } }),
    prisma.beneficiary.groupBy({ by: ['stage'], where: active, _count: true }),
    prisma.site.findMany({ orderBy: { name: 'asc' }, select: { name: true, _count: { select: { beneficiaries: { where: active } } } } }),
    prisma.event.findMany({ where: { startsAt: { gte: now } }, orderBy: { startsAt: 'asc' }, take: 4, include: { _count: { select: { rsvps: { where: { status: 'GOING' } } } } } }),
    prisma.announcement.findMany({ where: { audience: { in: visibleAudiences(user.role) } }, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }], take: 3, include: { author: { select: { name: true, image: true } } } }),
    canTasks ? prisma.task.findMany({ where: { assigneeId: user.id, status: { not: 'DONE' } }, orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }], take: 5 }) : [],
    canCases ? prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { actor: { select: { name: true } } } }) : [],
  ]);

  let finance: { balance: number; months: MonthPoint[] } | null = null;
  if (canFinance) {
    // Month buckets use Nairobi calendar months regardless of the server's timezone.
    const [ny, nm] = toDateInput(now).split('-').map(Number);
    const monthKeys = Array.from({ length: 6 }, (_, i) => { const d = new Date(Date.UTC(ny, nm - 6 + i, 1)); return d.toISOString().slice(0, 7); });
    const since = parseNairobi(`${monthKeys[0]}-01`);
    const [totals, recent] = await Promise.all([
      prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true } }),
      prisma.transaction.findMany({ where: { date: { gte: since } }, select: { type: true, amount: true, date: true } }),
    ]);
    const sum = (t: 'INCOME' | 'EXPENSE') => totals.find((x) => x.type === t)?._sum.amount ?? 0;
    const months: MonthPoint[] = monthKeys.map((k) => ({ month: new Date(`${k}-15T12:00:00Z`).toLocaleString('en-KE', { month: 'short', timeZone: 'UTC' }), income: 0, expense: 0 }));
    for (const t of recent) {
      const idx = monthKeys.indexOf(toDateInput(t.date).slice(0, 7));
      if (idx >= 0) months[idx][t.type === 'INCOME' ? 'income' : 'expense'] += t.amount;
    }
    finance = { balance: sum('INCOME') - sum('EXPENSE'), months };
  }

  const quickActions = [
    ...(canCases ? [{ href: '/beneficiaries/new', label: 'New intake', icon: UserPlus, primary: true }] : []),
    ...(can(user.role, 'announcements:post') ? [{ href: '/announcements', label: 'Post notice', icon: Megaphone, primary: !canCases }] : []),
    ...(can(user.role, 'events:manage') ? [{ href: '/events', label: 'Schedule event', icon: CalendarPlus, primary: false }] : []),
    ...(canFinance ? [{ href: '/finance', label: 'Record payment', icon: Wallet, primary: false }] : []),
    ...(!canCases ? [{ href: '/events', label: 'Upcoming events', icon: CalendarDays, primary: !can(user.role, 'announcements:post') }, { href: '/suggestions', label: 'Share an idea', icon: MessageSquareHeart, primary: false }] : []),
  ].filter((a, i, all) => all.findIndex((b) => b.href === a.href) === i).slice(0, 4);

  const pct = (n: number) => (beneficiaryCount ? Math.round((n / beneficiaryCount) * 100) : 0);
  const hour = Number(new Intl.DateTimeFormat('en-KE', { hour: 'numeric', hour12: false, timeZone: 'Africa/Nairobi' }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-6 py-7 text-white shadow-sm sm:px-8">
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime/10" />
        <div aria-hidden className="absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-[#2e9348]/25" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lime">{formatDate(now)}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{greeting}, {user.name.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-white/70">Here is what is happening across Eri Street Initiative.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href} className={cn('inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                a.primary ? 'bg-lime text-forest-950 hover:bg-lime-hover' : 'bg-white/10 text-white ring-1 ring-inset ring-white/15 hover:bg-white/15')}>
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="People we support" value={beneficiaryCount.toLocaleString()} hint={`${newThisMonth} new intake${newThisMonth === 1 ? '' : 's'} this month`} icon={<HeartHandshake className="h-5 w-5" />} />
        <StatCard label="Documentation gap" value={`${pct(missingDocs)}%`} hint={`${missingDocs} still need a birth certificate or ID`} icon={<FileWarning className="h-5 w-5" />} tone="amber" />
        <StatCard label="Healthcare access" value={`${pct(withHealthcare)}%`} hint="Enrolled in SHA or other cover" icon={<HeartPulse className="h-5 w-5" />} tone="leaf" />
        {finance ? (
          <StatCard label="Account balance" value={formatKES(finance.balance)} hint="All recorded income minus expenses" icon={<Wallet className="h-5 w-5" />} tone={finance.balance < 0 ? 'rose' : 'brand'} />
        ) : (
          <StatCard label="Graduated" value={graduated.toLocaleString()} hint={`${memberCount} active members & staff`} icon={<GraduationCap className="h-5 w-5" />} tone="leaf" />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Rehabilitation pipeline" description="Active people at each stage of the journey" className="lg:col-span-2"
          actions={canCases ? <Link href="/pipeline" className="text-sm font-medium text-brand-600 hover:underline">Open board</Link> : null}>
          <BarList data={STAGES.map((s) => ({ label: s.label, value: byStage.find((b) => b.stage === s.id)?._count ?? 0, hint: s.description }))} />
        </Card>
        <Card title="By site" description="Active people per location">
          <BarList data={sites.map((s) => ({ label: s.name, value: s._count.beneficiaries }))} emptyText="No sites configured yet" />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Noticeboard" className="lg:col-span-2" actions={<Link href="/announcements" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>}>
          {notices.length ? (
            <ul className="divide-y divide-slate-100">
              {notices.map((n) => (
                <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/announcements/${n.id}`} className="group flex gap-3">
                    <Avatar name={n.author.name} src={n.author.image} size="sm" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-slate-900 group-hover:text-brand-700">
                        {n.pinned ? <Pin className="h-3.5 w-3.5 text-leaf-600" aria-label="Pinned" /> : null}{n.title}
                      </p>
                      <p className="line-clamp-2 text-sm text-slate-600">{n.body}</p>
                      <p className="mt-1 text-xs text-slate-400">{n.author.name} · {timeAgo(n.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No announcements yet.</p>}
        </Card>

        <Card title="Coming up" actions={<Link href="/events" className="text-sm font-medium text-brand-600 hover:underline">Calendar</Link>}>
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex gap-3 rounded-lg p-1 hover:bg-slate-50">
                    <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <span className="text-[10px] font-semibold uppercase">{e.startsAt.toLocaleString('en-KE', { month: 'short', timeZone: 'Africa/Nairobi' })}</span>
                      <span className="text-lg font-bold leading-none">{e.startsAt.toLocaleString('en-KE', { day: 'numeric', timeZone: 'Africa/Nairobi' })}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.title}</p>
                      <p className="text-xs text-slate-500">{humanize(e.type)} · {e._count.rsvps} going</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Nothing scheduled" icon={<CalendarDays className="h-6 w-6" />} />}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {finance ? (
          <Card title="Money in & out" description="Last six months" className="lg:col-span-2" actions={<Link href="/finance" className="text-sm font-medium text-brand-600 hover:underline">Ledger</Link>}>
            <MonthlyBars data={finance.months} unit="kes" />
          </Card>
        ) : null}

        {canTasks ? (
          <Card title="My open tasks" actions={<Link href="/tasks" className="text-sm font-medium text-brand-600 hover:underline">Board</Link>}>
            {myTasks.length ? (
              <ul className="space-y-2">
                {myTasks.map((t) => {
                  const overdue = t.dueDate && t.dueDate < now;
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                      <span className="truncate text-sm">{t.title}</span>
                      {t.dueDate ? <Badge tone={overdue ? 'rose' : 'slate'}>{overdue ? 'Overdue' : formatDate(t.dueDate)}</Badge> : null}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-slate-500">You&apos;re all caught up. 🎉</p>}
          </Card>
        ) : null}

        {canCases ? (
          <Card title="Recent activity" className={finance ? 'lg:col-span-3' : 'lg:col-span-2'}
            actions={can(user.role, 'admin:access') ? <Link href="/admin?tab=audit" className="text-sm font-medium text-brand-600 hover:underline">Full log</Link> : null}>
            {activity.length ? (
              <ul className="divide-y divide-slate-100">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                    <span className="min-w-0 truncate text-slate-700">{a.summary}</span>
                    <span className="flex-none text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No activity yet.</p>}
          </Card>
        ) : null}

        {!canCases && !canTasks ? (
          <Card title="Our community" className="lg:col-span-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Users className="h-5 w-5 text-brand-600" />
              {memberCount} active members, {graduated} people graduated from the programme so far.
              <Link href="/suggestions" className="ml-auto inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">Share a suggestion <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
