'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize, ActionError } from '@/lib/session';
import { can } from '@/lib/permissions';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { announcementSchema, reqText } from '@/lib/validation';
import { audit } from '@/lib/audit';

export async function createAnnouncement(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('announcements:post');
    const data = announcementSchema.parse(formToObject(fd));
    // Only leadership may pin or post leadership-only notices.
    const moderator = can(me.role, 'announcements:moderate');
    const a = await prisma.announcement.create({
      data: { ...data, pinned: moderator && data.pinned, audience: !moderator && data.audience === 'LEADERSHIP' ? 'TEAM' : data.audience, authorId: me.id },
    });
    await audit(me.id, 'announcement.create', `${me.name} posted "${a.title}"`, { type: 'announcement', id: a.id });
    revalidatePath('/announcements');
    revalidatePath('/');
    return { ok: true, message: 'Announcement posted.' };
  });
}

export async function addComment(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('comments:post');
    const { announcementId, body } = z.object({ announcementId: z.string().cuid(), body: reqText(2000, 'Comment') }).parse(formToObject(fd));
    await prisma.comment.create({ data: { announcementId, body, authorId: me.id } });
    revalidatePath(`/announcements/${announcementId}`);
    return { ok: true };
  });
}

export async function togglePin(fd: FormData) {
  const me = await authorize('announcements:moderate');
  const id = z.string().cuid().parse(fd.get('id'));
  const a = await prisma.announcement.findUniqueOrThrow({ where: { id } });
  await prisma.announcement.update({ where: { id }, data: { pinned: !a.pinned } });
  await audit(me.id, 'announcement.pin', `${me.name} ${a.pinned ? 'unpinned' : 'pinned'} "${a.title}"`);
  revalidatePath('/announcements');
  revalidatePath(`/announcements/${id}`);
}

export async function deleteAnnouncement(fd: FormData) {
  const me = await authorize('dashboard:view');
  const id = z.string().cuid().parse(fd.get('id'));
  const a = await prisma.announcement.findUniqueOrThrow({ where: { id } });
  if (a.authorId !== me.id && !can(me.role, 'announcements:moderate')) throw new ActionError('Not allowed');
  await prisma.announcement.delete({ where: { id } });
  await audit(me.id, 'announcement.delete', `${me.name} deleted announcement "${a.title}"`);
  revalidatePath('/announcements');
  redirect('/announcements');
}

export async function deleteComment(fd: FormData) {
  const me = await authorize('dashboard:view');
  const id = z.string().cuid().parse(fd.get('id'));
  const c = await prisma.comment.findUniqueOrThrow({ where: { id } });
  if (c.authorId !== me.id && !can(me.role, 'announcements:moderate')) throw new ActionError('Not allowed');
  await prisma.comment.delete({ where: { id } });
  revalidatePath(`/announcements/${c.announcementId}`);
}
