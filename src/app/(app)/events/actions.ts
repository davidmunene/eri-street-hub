'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { eventSchema, optText } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { formatDate } from '@/lib/format';

export async function saveEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('events:manage');
    const id = fd.get('id')?.toString();
    const data = eventSchema.parse(formToObject(fd));
    const payload = { ...data, description: data.description ?? null, endsAt: data.endsAt ?? null, venue: data.venue ?? null, siteId: data.siteId ?? null };
    const event = id
      ? await prisma.event.update({ where: { id }, data: payload })
      : await prisma.event.create({ data: { ...payload, organizerId: me.id, rsvps: { create: { userId: me.id, status: 'GOING' } } } });
    await audit(me.id, id ? 'event.update' : 'event.create', `${me.name} ${id ? 'updated' : 'scheduled'} "${event.title}" on ${formatDate(event.startsAt)}`, { type: 'event', id: event.id });
    revalidatePath('/events');
    revalidatePath(`/events/${event.id}`);
    revalidatePath('/');
    return { ok: true, message: id ? 'Event updated.' : 'Event scheduled.' };
  });
}

export async function rsvp(fd: FormData) {
  const me = await authorize('events:rsvp');
  const { eventId, status } = z.object({ eventId: z.string().cuid(), status: z.enum(['GOING', 'MAYBE', 'NOT_GOING']) }).parse(formToObject(fd));
  await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId, userId: me.id } },
    create: { eventId, userId: me.id, status },
    update: { status },
  });
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
}

export async function saveAttendance(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('events:manage');
    const eventId = z.string().cuid().parse(fd.get('eventId'));
    const present = new Set(fd.getAll('attended').map(String));
    const rsvps = await prisma.eventRsvp.findMany({ where: { eventId } });
    await prisma.$transaction(rsvps.map((r) => prisma.eventRsvp.update({
      where: { eventId_userId: { eventId, userId: r.userId } },
      data: { attended: present.has(r.userId) },
    })));
    // Walk-ins: members who attended without RSVPing.
    const walkIns = [...present].filter((uid) => !rsvps.some((r) => r.userId === uid));
    if (walkIns.length) await prisma.eventRsvp.createMany({ data: walkIns.map((userId) => ({ eventId, userId, status: 'GOING', attended: true })), skipDuplicates: true });
    await audit(me.id, 'event.attendance', `${me.name} recorded attendance (${present.size} present)`, { type: 'event', id: eventId });
    revalidatePath(`/events/${eventId}`);
    return { ok: true, message: 'Attendance saved.' };
  });
}

export async function saveMinutes(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('events:manage');
    const { eventId, minutes } = z.object({ eventId: z.string().cuid(), minutes: optText(50_000) }).parse(formToObject(fd));
    const e = await prisma.event.update({ where: { id: eventId }, data: { minutes: minutes ?? null } });
    await audit(me.id, 'event.minutes', `${me.name} updated minutes for "${e.title}"`, { type: 'event', id: eventId });
    revalidatePath(`/events/${eventId}`);
    return { ok: true, message: 'Minutes saved.' };
  });
}

export async function deleteEvent(fd: FormData) {
  const me = await authorize('events:manage');
  const id = z.string().cuid().parse(fd.get('id'));
  const e = await prisma.event.delete({ where: { id } });
  await audit(me.id, 'event.delete', `${me.name} cancelled "${e.title}"`);
  revalidatePath('/events');
  redirect('/events');
}
