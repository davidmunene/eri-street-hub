'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { partnerSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export async function savePartner(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('partners:manage');
    const id = fd.get('id')?.toString();
    const data = partnerSchema.parse(formToObject(fd));
    const payload = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? null])) as typeof data;
    const p = id ? await prisma.partner.update({ where: { id }, data: payload }) : await prisma.partner.create({ data: payload });
    await audit(me.id, id ? 'partner.update' : 'partner.create', `${me.name} ${id ? 'updated' : 'added'} partner ${p.name}`);
    revalidatePath('/partners');
    return { ok: true, message: 'Partner saved.' };
  });
}

export async function deletePartner(fd: FormData) {
  const me = await authorize('partners:manage');
  const p = await prisma.partner.delete({ where: { id: z.string().cuid().parse(fd.get('id')) } });
  await audit(me.id, 'partner.delete', `${me.name} removed partner ${p.name}`);
  revalidatePath('/partners');
}
