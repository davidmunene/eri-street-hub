import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui';
import { toDateInput } from '@/lib/format';
import BeneficiaryForm from '../../BeneficiaryForm';
import { updateBeneficiary } from '../../actions';

export default async function EditBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser('beneficiaries:manage');
  const { id } = await params;
  const [b, sites, staff] = await Promise.all([
    prisma.beneficiary.findUnique({ where: { id }, include: { idDocuments: true } }),
    prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { status: 'ACTIVE', role: { in: ['ADMIN', 'OFFICIAL', 'STAFF'] } }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!b) notFound();
  const doc = (t: string) => b.idDocuments.find((d) => d.type === t);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={b.code} title={`Edit ${b.alias ?? b.legalName}`} />
      <BeneficiaryForm action={updateBeneficiary} sites={sites} staff={staff} defaults={{
        id: b.id, legalName: b.legalName, alias: b.alias ?? '', gender: b.gender, dateOfBirth: toDateInput(b.dateOfBirth), estimatedAge: b.estimatedAge,
        phone: b.phone ?? '', siteId: b.siteId ?? '', caseworkerId: b.caseworkerId ?? '', hasDisability: b.hasDisability, disabilityDetails: b.disabilityDetails ?? '',
        hasHealthcare: b.hasHealthcare, healthConditions: b.healthConditions ?? '', householdSize: b.householdSize, caregiverName: b.caregiverName ?? '',
        caregiverRelation: b.caregiverRelation ?? '', caregiverPhone: b.caregiverPhone ?? '', vulnerabilityFlags: b.vulnerabilityFlags, consentGiven: b.consentGiven,
        status: b.status, birthCertificate: doc('BIRTH_CERTIFICATE')?.status, nationalId: doc('NATIONAL_ID')?.status, nationalIdNumber: doc('NATIONAL_ID')?.number ?? '', shaCard: doc('SHA_CARD')?.status,
      }} />
    </div>
  );
}
