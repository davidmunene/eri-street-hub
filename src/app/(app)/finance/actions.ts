'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { transactionSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { formatKES, toDateInput } from '@/lib/format';

export async function recordTransaction(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('finance:manage');
    const data = transactionSchema.parse(formToObject(fd));
    const tx = await prisma.transaction.create({ data: { ...data, recordedById: me.id } });
    await audit(me.id, 'finance.create', `${me.name} recorded ${tx.type.toLowerCase()} of ${formatKES(tx.amount)} (${tx.category})`, { type: 'transaction', id: tx.id });
    revalidatePath('/finance');
    revalidatePath('/');
    return { ok: true, message: `${tx.type === 'INCOME' ? 'Income' : 'Expense'} of ${formatKES(tx.amount)} recorded.` };
  });
}

export async function deleteTransaction(fd: FormData) {
  const me = await authorize('finance:manage');
  const id = z.string().cuid().parse(fd.get('id'));
  const tx = await prisma.transaction.delete({ where: { id } });
  // Deleting money records is sensitive: always leave a trail.
  await audit(me.id, 'finance.delete', `${me.name} deleted ${tx.type.toLowerCase()} of ${formatKES(tx.amount)} (${tx.category}, ${toDateInput(tx.date)})`);
  revalidatePath('/finance');
  revalidatePath('/');
}
