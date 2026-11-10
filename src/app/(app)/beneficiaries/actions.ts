'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma, type IdDocType, type Stage } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/session';
import { runAction, formToObject, type ActionState } from '@/lib/actions';
import { beneficiarySchema, reqText } from '@/lib/validation';
import { fileFromForm, storeFile } from '@/lib/storage';
import { audit } from '@/lib/audit';
import { beneficiaryCode, stageLabel } from '@/lib/format';

const STAGE_IDS = ['HELPING_HAND', 'IDENTIFICATION', 'ACCESS_REHABILITATION', 'REINTEGRATION', 'RESOCIALIZATION', 'GRADUATED'] as const;

async function nextCode(tx: Prisma.TransactionClient) {
  const last = await tx.beneficiary.findFirst({ orderBy: { code: 'desc' }, select: { code: true } });
  return beneficiaryCode((last ? Number(last.code.replace(/\D/g, '')) : 0) + 1);
}

function splitPayload(data: z.infer<typeof beneficiarySchema>) {
  const { birthCertificate, nationalId, nationalIdNumber, shaCard, initialNote, ...rest } = data;
  void initialNote;
  const docs: { type: IdDocType; status: typeof birthCertificate; number?: string | null }[] = [
    { type: 'BIRTH_CERTIFICATE', status: birthCertificate },
    { type: 'NATIONAL_ID', status: nationalId, number: nationalIdNumber ?? null },
    { type: 'SHA_CARD', status: shaCard },
  ];
  const nullable = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === undefined ? null : v])) as typeof rest;
  return { fields: { ...nullable, hasHealthcare: rest.hasHealthcare || shaCard === 'OBTAINED' }, docs };
}

export async function createBeneficiary(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('beneficiaries:manage');
    const data = beneficiarySchema.parse(formToObject(fd));
    const { fields, docs } = splitPayload(data);
    const photo = fileFromForm(fd, 'photo');
    const photoUrl = photo ? (await storeFile(photo, 'beneficiaries', { imagesOnly: true })).url : null;

    let id = '';
    for (let attempt = 0; attempt < 3 && !id; attempt++) {
      try {
        const b = await prisma.$transaction(async (tx) =>
          tx.beneficiary.create({
            data: {
              ...fields, photoUrl, code: await nextCode(tx), registeredById: me.id, caseworkerId: fields.caseworkerId ?? me.id,
              idDocuments: { create: docs },
              notes: data.initialNote ? { create: { body: data.initialNote, authorId: me.id } } : undefined,
            },
          }),
        );
        id = b.id;
        await audit(me.id, 'beneficiary.create', `${me.name} registered ${b.code} (${b.alias ?? b.legalName.split(' ')[0]})`, { type: 'beneficiary', id });
      } catch (e) {
        // Two intakes at the same moment can race for the same case code: retry.
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      }
    }
    if (!id) return { error: 'Could not allocate a case number. Please try again.' };
    revalidatePath('/beneficiaries');
    revalidatePath('/pipeline');
    revalidatePath('/');
    redirect(`/beneficiaries/${id}?created=1`);
  });
}

export async function updateBeneficiary(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('beneficiaries:manage');
    const id = z.string().cuid().parse(fd.get('id'));
    const data = beneficiarySchema.parse(formToObject(fd));
    const { fields, docs } = splitPayload(data);
    const photo = fileFromForm(fd, 'photo');
    const photoUrl = photo ? (await storeFile(photo, 'beneficiaries', { imagesOnly: true })).url : undefined;
    const b = await prisma.$transaction(async (tx) => {
      for (const d of docs) {
        await tx.idDocument.upsert({
          where: { beneficiaryId_type: { beneficiaryId: id, type: d.type } },
          create: { beneficiaryId: id, ...d },
          update: { status: d.status, ...(d.number !== undefined ? { number: d.number } : {}) },
        });
      }
      return tx.beneficiary.update({ where: { id }, data: { ...fields, ...(photoUrl ? { photoUrl } : {}) } });
    });
    await audit(me.id, 'beneficiary.update', `${me.name} updated the record for ${b.code}`, { type: 'beneficiary', id });
    revalidatePath(`/beneficiaries/${id}`);
    revalidatePath('/beneficiaries');
    redirect(`/beneficiaries/${id}`);
  });
}

/** Used by both the profile page and the pipeline board. */
export async function changeStage(id: string, toStage: string): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('beneficiaries:manage');
    const stage = z.enum(STAGE_IDS).parse(toStage) as Stage;
    const prev = await prisma.beneficiary.findUniqueOrThrow({ where: { id: z.string().cuid().parse(id) } });
    if (prev.stage === stage) return { ok: true };
    await prisma.$transaction([
      prisma.beneficiary.update({ where: { id }, data: { stage, stageChangedAt: new Date() } }),
      prisma.stageChange.create({ data: { beneficiaryId: id, fromStage: prev.stage, toStage: stage, changedById: me.id } }),
    ]);
    await audit(me.id, 'beneficiary.stage', `${me.name} moved ${prev.code} from ${stageLabel(prev.stage)} to ${stageLabel(stage)}`, { type: 'beneficiary', id });
    revalidatePath('/pipeline');
    revalidatePath(`/beneficiaries/${id}`);
    revalidatePath('/beneficiaries');
    revalidatePath('/');
    return { ok: true, message: `Moved to ${stageLabel(stage)}` };
  });
}

export async function addCaseNote(_: ActionState, fd: FormData): Promise<ActionState> {
  return runAction(async () => {
    const me = await authorize('beneficiaries:manage');
    const { beneficiaryId, body } = z.object({ beneficiaryId: z.string().cuid(), body: reqText(5000, 'Note') }).parse(formToObject(fd));
    await prisma.caseNote.create({ data: { beneficiaryId, body, authorId: me.id } });
    revalidatePath(`/beneficiaries/${beneficiaryId}`);
    return { ok: true };
  });
}

export async function setDocumentStatus(fd: FormData) {
  const me = await authorize('beneficiaries:manage');
  const { beneficiaryId, type, status } = z.object({
    beneficiaryId: z.string().cuid(),
    type: z.enum(['BIRTH_CERTIFICATE', 'NATIONAL_ID', 'SHA_CARD', 'SOCIAL_PROTECTION', 'OTHER']),
    status: z.enum(['MISSING', 'IN_PROCESS', 'OBTAINED']),
  }).parse(formToObject(fd));
  await prisma.idDocument.upsert({
    where: { beneficiaryId_type: { beneficiaryId, type } },
    create: { beneficiaryId, type, status },
    update: { status },
  });
  if (type === 'SHA_CARD' && status === 'OBTAINED') await prisma.beneficiary.update({ where: { id: beneficiaryId }, data: { hasHealthcare: true } });
  await audit(me.id, 'beneficiary.document', `${me.name} marked ${type.replace(/_/g, ' ').toLowerCase()} as ${status.replace('_', ' ').toLowerCase()}`, { type: 'beneficiary', id: beneficiaryId });
  revalidatePath(`/beneficiaries/${beneficiaryId}`);
}

export async function deleteBeneficiary(fd: FormData) {
  const me = await authorize('beneficiaries:delete');
  const id = z.string().cuid().parse(fd.get('id'));
  const b = await prisma.beneficiary.delete({ where: { id } });
  await audit(me.id, 'beneficiary.delete', `${me.name} permanently deleted record ${b.code}`);
  revalidatePath('/beneficiaries');
  revalidatePath('/pipeline');
  redirect('/beneficiaries');
}
