import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Trash2, User } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Avatar, Badge, Card, buttonClass, cn } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { formatDate, humanize, toDateTimeLocal } from '@/lib/format';
import { EVENT_TONES } from '../constants';
import EventForm from '../EventForm';
import { AttendanceForm, MinutesForm } from './EventManage';
import { deleteEvent, rsvp } from '../actions';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser('dashboard:view');
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { site: true, organizer: { select: { name: true } }, rsvps: { include: { user: { select: { id: true, name: true, image: true } } } } },
  });
  if (!event) notFound();

  const manage = can(user.role, 'events:manage');
  const mine = event.rsvps.find((r) => r.userId === user.id)?.status;
  const going = event.rsvps.filter((r) => r.status === 'GOING');
  const maybe = event.rsvps.filter((r) => r.status === 'MAYBE');
  const isPast = event.startsAt < new Date();
  const [sites, members] = manage
    ? await Promise.all([
        prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
        prisma.user.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      ])
    : [[], []];

  return (
    <div>
      <Link href="/events" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Events</Link>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone={EVENT_TONES[event.type]}>{humanize(event.type)}</Badge>
                <h1 className="mt-2 text-2xl font-bold">{event.title}</h1>
              </div>
              {manage ? (
                <div className="flex gap-2">
                  <EventForm sites={sites} event={{ ...event, startsAt: toDateTimeLocal(event.startsAt), endsAt: toDateTimeLocal(event.endsAt) }} />
                  <InlineAction action={deleteEvent} hidden={{ id: event.id }} confirm="Cancel and delete this event?">
                    <button className={buttonClass('danger')} aria-label="Delete event"><Trash2 className="h-4 w-4" /></button>
                  </InlineAction>
                </div>
              ) : null}
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" />{formatDate(event.startsAt, true)}{event.endsAt ? ` – ${event.endsAt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' })}` : ''}</div>
              {event.venue || event.site ? <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{[event.venue, event.site?.name].filter(Boolean).join(' · ')}</div> : null}
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" />Organised by {event.organizer.name}</div>
            </dl>
            {event.description ? <div className="prose-text mt-5 border-t border-slate-100 pt-5">{event.description}</div> : null}
          </Card>

          <Card title={event.type === 'MEETING' ? 'Minutes' : 'Report & notes'} description={manage ? 'Record what was discussed and agreed.' : undefined}>
            {manage ? <MinutesForm eventId={event.id} minutes={event.minutes} /> : event.minutes ? <div className="prose-text">{event.minutes}</div> : <p className="text-sm text-slate-500">No minutes have been posted yet.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          {can(user.role, 'events:rsvp') && !isPast ? (
            <Card title="Will you attend?">
              <div className="grid grid-cols-3 gap-2">
                {([['GOING', 'Going'], ['MAYBE', 'Maybe'], ['NOT_GOING', "Can't go"]] as const).map(([s, l]) => (
                  <InlineAction key={s} action={rsvp} hidden={{ eventId: event.id, status: s }}>
                    <button className={cn(buttonClass(mine === s ? 'primary' : 'secondary', 'sm'), 'w-full')}>{l}</button>
                  </InlineAction>
                ))}
              </div>
            </Card>
          ) : null}

          <Card title={`Going (${going.length})`} description={maybe.length ? `${maybe.length} maybe` : undefined}>
            {going.length ? (
              <ul className="space-y-2">
                {going.map((r) => (
                  <li key={r.userId} className="flex items-center gap-2 text-sm">
                    <Avatar name={r.user.name} src={r.user.image} size="sm" />{r.user.name}
                    {r.attended ? <Badge tone="leaf" className="ml-auto">Attended</Badge> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No RSVPs yet.</p>}
          </Card>

          {manage && isPast ? (
            <Card title="Attendance register" description="Tick everyone who attended, including walk-ins.">
              <AttendanceForm eventId={event.id} people={members.map((m) => {
                const r = event.rsvps.find((x) => x.userId === m.id);
                return { id: m.id, name: m.name, rsvp: r?.status ?? null, attended: r?.attended ?? false };
              })} />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
