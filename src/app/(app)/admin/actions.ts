'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { optText, reqText } from '@/lib/validation';
import { audit } from '@/lib/audit';

export async function addSite(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('admin:access');
    const data = z.object({ name: reqText(80, 'Name'), description: optText(300) }).parse(formToObject(fd));
    try {
      const s = await prisma.site.create({ data });
      await audit(me.id, 'site.create', `${me.name} added site ${s.name}`);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { error: 'A site with that name already exists.' };
      throw e;
    }
    revalidatePath('/admin');
    return { ok: true, message: 'Site added.' };
  });
}

export async function deleteSite(fd: FormData) {
  const me = await authorize('admin:access');
  // Records keep existing; their site is simply cleared (onDelete: SetNull).
  const s = await prisma.site.delete({ where: { id: z.string().cuid().parse(fd.get('id')) } });
  await audit(me.id, 'site.delete', `${me.name} removed site ${s.name}`);
  revalidatePath('/admin');
}
