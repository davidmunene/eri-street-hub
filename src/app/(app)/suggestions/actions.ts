'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { optText, suggestionSchema } from '@/lib/validation';

export async function submitSuggestion(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('suggestions:submit');
    const data = suggestionSchema.parse(formToObject(fd));
    // Anonymous means anonymous: the author is not stored at all.
    await prisma.suggestion.create({ data: { body: data.body, anonymous: data.anonymous, authorId: data.anonymous ? null : me.id } });
    revalidatePath('/suggestions');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Thank you! Your suggestion has been shared with the leadership team.' };
  });
}

export async function respondSuggestion(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    await authorize('suggestions:review');
    const { id, status, response } = z.object({ id: z.string().cuid(), status: z.enum(['NEW', 'REVIEWED', 'ACTIONED']), response: optText(2000) }).parse(formToObject(fd));
    await prisma.suggestion.update({ where: { id }, data: { status, response: response ?? null } });
    revalidatePath('/suggestions');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Saved.' };
  });
}
