'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { authorize, ActionError } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { passwordSchema, profileSchema } from '@/lib/validation';
import { fileFromForm, storeFile } from '@/lib/storage';
import { audit } from '@/lib/audit';

const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Choose a different password from the current one' });

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('dashboard:view');
    const data = changePasswordSchema.parse(formToObject(fd));
    const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
    if (!(await bcrypt.compare(data.currentPassword, user.passwordHash))) {
      return { error: 'Your current password is incorrect.', fieldErrors: { currentPassword: 'Incorrect password' } };
    }
    await prisma.user.update({
      where: { id: me.id },
      data: { passwordHash: await bcrypt.hash(data.newPassword, 12), mustChangePassword: false },
    });
    await audit(me.id, 'user.password', `${me.name} changed their password`);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Password updated.' };
  });
}

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('dashboard:view');
    const data = profileSchema.parse(formToObject(fd));
    const avatar = fileFromForm(fd, 'avatar');
    let image: string | undefined;
    if (avatar) image = (await storeFile(avatar, 'avatars', { imagesOnly: true })).url;
    await prisma.user.update({
      where: { id: me.id },
      data: { name: data.name, phone: data.phone ?? null, bio: data.bio ?? null, skills: data.skills, ...(image ? { image } : {}) },
    });
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Profile saved.' };
  });
}

export async function removeAvatar(): Promise<void> {
  const me = await authorize('dashboard:view').catch(() => { throw new ActionError('Not signed in'); });
  await prisma.user.update({ where: { id: me.id }, data: { image: null } });
  revalidatePath('/', 'layout');
}
