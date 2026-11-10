'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { taskSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

export async function saveTask(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('tasks:manage');
    const id = fd.get('id')?.toString();
    const data = taskSchema.parse(formToObject(fd));
    const payload = { ...data, description: data.description ?? null, dueDate: data.dueDate ?? null, assigneeId: data.assigneeId ?? null };
    const task = id
      ? await prisma.task.update({ where: { id }, data: payload, include: { assignee: true } })
      : await prisma.task.create({ data: { ...payload, creatorId: me.id }, include: { assignee: true } });
    await audit(me.id, id ? 'task.update' : 'task.create', `${me.name} ${id ? 'updated' : 'created'} task "${task.title}"${task.assignee ? ` for ${task.assignee.name}` : ''}`, { type: 'task', id: task.id });
    revalidatePath('/tasks');
    revalidatePath('/');
    return { ok: true };
  });
}

const moveSchema = z.object({ id: z.string().cuid(), status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']) });

export async function moveTask(id: string, status: string): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('tasks:manage');
    const data = moveSchema.parse({ id, status });
    const task = await prisma.task.update({
      where: { id: data.id },
      data: { status: data.status, completedAt: data.status === 'DONE' ? new Date() : null },
    });
    if (data.status === 'DONE') await audit(me.id, 'task.done', `${me.name} completed "${task.title}"`, { type: 'task', id: task.id });
    revalidatePath('/tasks');
    revalidatePath('/', 'layout');
  });
}

export async function deleteTask(id: string): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('tasks:manage');
    const task = await prisma.task.delete({ where: { id: z.string().cuid().parse(id) } });
    await audit(me.id, 'task.delete', `${me.name} deleted task "${task.title}"`);
    revalidatePath('/tasks');
  });
}
