'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { fieldReportSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { humanize } from '@/lib/format';

export async function createFieldReport(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('reports:manage');
    const { beneficiaryIds, ...data } = fieldReportSchema.parse(formToObject(fd));
    const ids = z.array(z.string().cuid()).parse(beneficiaryIds);
    const r = await prisma.fieldReport.create({
      data: { ...data, peopleReached: data.peopleReached ?? (ids.length || null), staffId: me.id, beneficiaries: { connect: ids.map((id) => ({ id })) } },
    });
    await audit(me.id, 'report.create', `${me.name} logged a ${humanize(r.type).toLowerCase()} intervention${ids.length ? ` for ${ids.length} people` : ''}`, { type: 'fieldReport', id: r.id });
    revalidatePath('/field-reports');
    for (const id of ids) revalidatePath(`/beneficiaries/${id}`);
    return { ok: true, message: 'Field report saved.' };
  });
}

export async function deleteFieldReport(fd: FormData) {
  const me = await authorize('reports:manage');
  const id = z.string().cuid().parse(fd.get('id'));
  await prisma.fieldReport.delete({ where: { id } });
  await audit(me.id, 'report.delete', `${me.name} deleted a field report`);
  revalidatePath('/field-reports');
}
