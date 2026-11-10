'use server';

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorize, ActionError } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { memberSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

/** Readable temporary password, e.g. "Kite-7342-Rain". The member must change it on first sign-in. */
function tempPassword(): string {
  const words = ['Baobab', 'Simba', 'Jua', 'Mvua', 'Nyota', 'Kite', 'River', 'Cedar', 'Ndege', 'Maua', 'Ocean', 'Upepo'];
  const b = randomBytes(4);
  return `${words[b[0] % words.length]}-${1000 + (b.readUInt16BE(1) % 9000)}-${words[b[3] % words.length]}`;
}

async function ensureNotLastAdmin(userId: string, nextRole?: string, nextStatus?: string) {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const losingAdmin = target.role === 'ADMIN' && target.status === 'ACTIVE' && ((nextRole && nextRole !== 'ADMIN') || nextStatus === 'INACTIVE');
  if (losingAdmin && (await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } })) <= 1) {
    throw new ActionError('There must always be at least one active administrator.');
  }
}

export async function saveMember(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('members:manage');
    const id = fd.get('id')?.toString();
    const data = memberSchema.parse(formToObject(fd));
    const payload = { ...data, position: data.position ?? null, phone: data.phone ?? null, siteId: data.siteId ?? null };
    try {
      if (id) {
        await ensureNotLastAdmin(id, data.role, data.status);
        const u = await prisma.user.update({ where: { id }, data: payload });
        await audit(me.id, 'member.update', `${me.name} updated ${u.name} (${u.role}, ${u.status.toLowerCase()})`, { type: 'user', id });
        revalidatePath('/members');
        revalidatePath(`/members/${id}`);
        return { ok: true, message: 'Member updated.' };
      }
      const password = tempPassword();
      const u = await prisma.user.create({ data: { ...payload, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true } });
      await audit(me.id, 'member.create', `${me.name} added ${u.name} as ${u.role}`, { type: 'user', id: u.id });
      revalidatePath('/members');
      return { ok: true, message: `${u.name} can now sign in with ${u.email} and the temporary password: ${password} (shown only once; share it privately).` };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return { error: 'Someone with that email already exists.', fieldErrors: { email: 'Already in use' } };
      }
      throw e;
    }
  });
}

export async function resetPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('members:manage');
    const id = z.string().cuid().parse(fd.get('id'));
    const password = tempPassword();
    const u = await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true } });
    await audit(me.id, 'member.reset', `${me.name} reset the password for ${u.name}`, { type: 'user', id });
    return { ok: true, message: `New temporary password for ${u.name}: ${password} (shown only once).` };
  });
}
