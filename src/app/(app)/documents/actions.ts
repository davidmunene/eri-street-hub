'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize, ActionError } from '@/lib/session';
import { can } from '@/lib/permissions';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { documentSchema } from '@/lib/validation';
import { fileFromForm, storeFile } from '@/lib/storage';
import { audit } from '@/lib/audit';

export async function uploadDocument(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('documents:upload');
    const data = documentSchema.parse(formToObject(fd));
    const file = fileFromForm(fd, 'file');
    if (!file && !data.externalUrl) return { error: 'Attach a file or paste a link.', fieldErrors: { file: 'Required' } };
    const stored = file ? await storeFile(file, 'documents') : null;
    const audience = data.audience === 'LEADERSHIP' && !can(me.role, 'documents:moderate') ? 'TEAM' : data.audience;
    const doc = await prisma.document.create({
      data: {
        title: data.title, description: data.description, category: data.category, audience,
        externalUrl: data.externalUrl, fileUrl: stored?.url, fileName: stored?.name, fileSize: stored?.size, mimeType: stored?.type,
        uploaderId: me.id,
      },
    });
    await audit(me.id, 'document.create', `${me.name} shared "${doc.title}"`, { type: 'document', id: doc.id });
    revalidatePath('/documents');
    return { ok: true, message: 'Document shared.' };
  });
}

export async function deleteDocument(fd: FormData) {
  const me = await authorize('dashboard:view');
  const id = z.string().cuid().parse(fd.get('id'));
  const doc = await prisma.document.findUniqueOrThrow({ where: { id } });
  if (doc.uploaderId !== me.id && !can(me.role, 'documents:moderate')) throw new ActionError('Not allowed');
  await prisma.document.delete({ where: { id } });
  await audit(me.id, 'document.delete', `${me.name} removed "${doc.title}"`);
  revalidatePath('/documents');
}
