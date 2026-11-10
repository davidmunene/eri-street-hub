import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { PageHeader, buttonClass, inputClass } from '@/components/ui';
import { daysSince } from '@/lib/format';
import PipelineBoard from './PipelineBoard';

export const metadata: Metadata = { title: 'Case pipeline' };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ site?: string; mine?: string }> }) {
  const user = await requireUser('beneficiaries:view');
  const { site, mine } = await searchParams;
  const where: Prisma.BeneficiaryWhereInput = { status: 'ACTIVE', ...(site ? { siteId: site } : {}), ...(mine ? { caseworkerId: user.id } : {}) };
  const [rows, sites] = await Promise.all([
    prisma.beneficiary.findMany({
      where, orderBy: { stageChangedAt: 'asc' },
      select: { id: true, code: true, legalName: true, alias: true, photoUrl: true, stage: true, stageChangedAt: true, vulnerabilityFlags: true, site: { select: { name: true } },
        idDocuments: { where: { type: { in: ['BIRTH_CERTIFICATE', 'NATIONAL_ID'] }, status: { not: 'OBTAINED' } }, select: { id: true } } },
    }),
    prisma.site.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <>
      <PageHeader title="Case pipeline" description={`${rows.length} active cases. Drag a card to move someone to their next stage; every move is logged. Days show time in the current stage.`}
        actions={
          <form className="flex gap-2">
            <select name="site" defaultValue={site ?? ''} aria-label="Site" className={`${inputClass} w-44`}><option value="">All sites</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <label className="flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600"><input type="checkbox" name="mine" value="1" defaultChecked={!!mine} className="rounded border-slate-300 text-primary" /> My cases</label>
            <button className={buttonClass('secondary')}>Apply</button>
          </form>
        } />
      <PipelineBoard
        canEdit={can(user.role, 'beneficiaries:manage')}
        cards={rows.map((b) => ({ id: b.id, code: b.code, name: b.legalName, alias: b.alias, photoUrl: b.photoUrl, stage: b.stage, days: daysSince(b.stageChangedAt), site: b.site?.name ?? null, flags: b.vulnerabilityFlags, missingDocs: b.idDocuments.length > 0 }))}
      />
    </>
  );
}
