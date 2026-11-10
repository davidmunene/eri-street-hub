import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui';
import BeneficiaryForm from '../BeneficiaryForm';
import { createBeneficiary } from '../actions';

export const metadata: Metadata = { title: 'New intake' };

export default async function NewBeneficiaryPage() {
  await requireUser('beneficiaries:manage');
  const [sites, staff] = await Promise.all([
    prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { status: 'ACTIVE', role: { in: ['ADMIN', 'OFFICIAL', 'STAFF'] } }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Helping Hand" title="New beneficiary intake" description="Register someone joining the programme. Only the name, gender and consent are required; you can complete the rest later." />
      <BeneficiaryForm action={createBeneficiary} sites={sites} staff={staff} />
    </div>
  );
}
