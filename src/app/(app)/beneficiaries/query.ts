import type { Prisma, Stage, CaseStatus } from '@prisma/client';
import { STAGES } from '@/lib/format';

export type BeneficiaryFilters = { q?: string; stage?: string; site?: string; status?: string; docs?: string; page?: string };

/** Shared by the directory page and the CSV export so they always agree. */
export function beneficiaryWhere(f: BeneficiaryFilters): Prisma.BeneficiaryWhereInput {
  const where: Prisma.BeneficiaryWhereInput = {};
  if (f.q) {
    where.OR = [
      { legalName: { contains: f.q, mode: 'insensitive' } },
      { alias: { contains: f.q, mode: 'insensitive' } },
      { code: { contains: f.q, mode: 'insensitive' } },
    ];
  }
  if (f.stage && STAGES.some((s) => s.id === f.stage)) where.stage = f.stage as Stage;
  if (f.site) where.siteId = f.site;
  if (f.status && ['ACTIVE', 'ON_HOLD', 'EXITED'].includes(f.status)) where.status = f.status as CaseStatus;
  else if (f.status !== 'ALL') where.status = { not: 'EXITED' };
  if (f.docs === 'missing') where.idDocuments = { some: { type: { in: ['BIRTH_CERTIFICATE', 'NATIONAL_ID'] }, status: { not: 'OBTAINED' } } };
  return where;
}
