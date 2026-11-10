import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { audit } from '@/lib/audit';
import { ageFrom, csvEscape, stageLabel, toDateInput } from '@/lib/format';
import { beneficiaryWhere } from '../query';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'beneficiaries:view')) return new Response('Forbidden', { status: 403 });
  const f = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await prisma.beneficiary.findMany({
    where: beneficiaryWhere(f), orderBy: { code: 'asc' },
    include: { site: true, caseworker: { select: { name: true } }, idDocuments: true },
  });
  const doc = (b: (typeof rows)[number], t: string) => b.idDocuments.find((d) => d.type === t)?.status ?? 'MISSING';
  const header = ['Case no.', 'Name', 'Alias', 'Gender', 'Age', 'Site', 'Stage', 'Status', 'Birth certificate', 'National ID', 'SHA card', 'Disability', 'Healthcare', 'Vulnerabilities', 'Caseworker', 'Intake date'];
  const lines = rows.map((b) => [
    b.code, b.legalName, b.alias, b.gender, ageFrom(b.dateOfBirth, b.estimatedAge), b.site?.name, stageLabel(b.stage), b.status,
    doc(b, 'BIRTH_CERTIFICATE'), doc(b, 'NATIONAL_ID'), doc(b, 'SHA_CARD'), b.hasDisability ? 'Yes' : 'No', b.hasHealthcare ? 'Yes' : 'No',
    b.vulnerabilityFlags.join('; '), b.caseworker?.name, toDateInput(b.intakeDate),
  ].map(csvEscape).join(','));
  // Exports of personal data are always audited.
  await audit(user.id, 'beneficiary.export', `${user.name} exported ${rows.length} beneficiary records`);
  return new Response([header.join(','), ...lines].join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="eri-street-beneficiaries-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' },
  });
}
