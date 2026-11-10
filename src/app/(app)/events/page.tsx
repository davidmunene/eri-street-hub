import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Badge, EmptyState, PageHeader, cn } from '@/components/ui';
import { EVENT_TONES } from './constants';
import { formatDate, humanize } from '@/lib/format';
import EventForm from './EventForm';

export const metadata: Metadata = { title: 'Events & meetings' };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser('dashboard:view');
  const past = (await searchParams).view === 'past';
  const now = new Date();
  const [events, sites] = await Promise.all([
    prisma.event.findMany({
      where: past ? { startsAt: { lt: now } } : { startsAt: { gte: new Date(now.getTime() - 12 * 3600_000) } },
      orderBy: { startsAt: past ? 'desc' : 'asc' },
      take: 60,
      include: { site: true, rsvps: { where: { userId: user.id } }, _count: { select: { rsvps: { where: { status: 'GOING' } } } } },
    }),
    prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Events & meetings" description="Meetings, outreach days, trainings and fundraisers. RSVP so organisers can plan."
        actions={can(user.role, 'events:manage') ? <EventForm sites={sites} /> : null} />
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        {[{ k: '', l: 'Upcoming' }, { k: 'past', l: 'Past' }].map((t) => (
          <Link key={t.k} href={t.k ? `/events?view=${t.k}` : '/events'} className={cn('rounded-md px-3 py-1.5 font-medium', (past ? 'past' : '') === t.k ? 'bg-surface shadow-sm' : 'text-slate-600')}>{t.l}</Link>
        ))}
      </div>
      {events.length === 0 ? (
        <EmptyState title={past ? 'No past events' : 'Nothing scheduled'} description={past ? undefined : 'Upcoming meetings and activities will show here.'} icon={<CalendarDays className="h-8 w-8" />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((e) => {
            const mine = e.rsvps[0]?.status;
            return (
              <Link key={e.id} href={`/events/${e.id}`} className="flex gap-4 rounded-xl border border-slate-200 bg-surface p-5 shadow-sm transition hover:border-brand-200 hover:shadow">
                <div className="flex h-16 w-16 flex-none flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <span className="text-xs font-semibold uppercase">{e.startsAt.toLocaleString('en-KE', { month: 'short', timeZone: 'Africa/Nairobi' })}</span>
                  <span className="text-2xl font-bold leading-none">{e.startsAt.toLocaleString('en-KE', { day: 'numeric', timeZone: 'Africa/Nairobi' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={EVENT_TONES[e.type]}>{humanize(e.type)}</Badge>
                    {mine === 'GOING' ? <Badge tone="leaf">You&apos;re going</Badge> : mine === 'MAYBE' ? <Badge tone="amber">Maybe</Badge> : null}
                    {past && e.minutes ? <Badge>Minutes available</Badge> : null}
                  </div>
                  <h2 className="mt-1.5 truncate font-semibold">{e.title}</h2>
                  <p className="text-sm text-slate-500">{formatDate(e.startsAt, true)}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {e.venue || e.site ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.venue ?? e.site?.name}</span> : null}
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{e._count.rsvps} going</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
