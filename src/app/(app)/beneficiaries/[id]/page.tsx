import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, AlertTriangle, PartyPopper } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Avatar, Badge, Card, LinkButton, buttonClass } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { ageFrom, daysSince, formatDate, humanize, stageLabel, timeAgo } from '@/lib/format';
import { STAGE_TONES } from '../constants';
import { DocStatusSelect, NoteForm, StageStepper } from './CaseControls';
import { deleteBeneficiary } from '../actions';

const DOC_TYPES = [
  { type: 'BIRTH_CERTIFICATE', label: 'Birth certificate' },
  { type: 'NATIONAL_ID', label: 'National ID' },
  { type: 'SHA_CARD', label: 'SHA health cover' },
  { type: 'SOCIAL_PROTECTION', label: 'Social protection (Inua Jamii etc.)' },
] as const;

export default async function BeneficiaryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requireUser('beneficiaries:view');
  const { id } = await params;
  const { created } = await searchParams;
  const b = await prisma.beneficiary.findUnique({
    where: { id },
    include: {
      site: true, caseworker: { select: { name: true } }, registeredBy: { select: { name: true } }, idDocuments: true,
      notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true, image: true } } } },
      stageChanges: { orderBy: { createdAt: 'desc' }, take: 10, include: { changedBy: { select: { name: true } } } },
      fieldReports: { orderBy: { date: 'desc' }, take: 10, include: { staff: { select: { name: true } } } },
    },
  });
  if (!b) notFound();
  const edit = can(user.role, 'beneficiaries:manage');
  const age = ageFrom(b.dateOfBirth, b.estimatedAge);

  const facts: [string, React.ReactNode][] = [
    ['Gender', humanize(b.gender)],
    ['Age', age != null ? `${age}${b.dateOfBirth ? '' : ' (estimated)'}` : '—'],
    ['Site', b.site?.name ?? '—'],
    ['Phone', b.phone ?? '—'],
    ['Caseworker', b.caseworker?.name ?? '—'],
    ['Intake', `${formatDate(b.intakeDate)} by ${b.registeredBy?.name ?? 'unknown'}`],
    ['Household size', b.householdSize ?? '—'],
    ['Caregiver', b.caregiverName ? `${b.caregiverName}${b.caregiverRelation ? ` (${b.caregiverRelation})` : ''}${b.caregiverPhone ? ` · ${b.caregiverPhone}` : ''}` : '—'],
  ];

  return (
    <div>
      <Link href="/beneficiaries" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Beneficiaries</Link>
      {created ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-leaf-50 px-4 py-3 text-sm text-leaf-700"><PartyPopper className="h-4 w-4" /> Intake complete. {b.code} has been added to the Helping Hand stage.</div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={b.alias ?? b.legalName} src={b.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">{b.code}</p>
            <h1 className="text-2xl font-bold">{b.legalName}{b.alias ? <span className="font-normal text-slate-500"> “{b.alias}”</span> : null}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={STAGE_TONES[b.stage]}>{stageLabel(b.stage)} · {daysSince(b.stageChangedAt)}d</Badge>
              {b.status !== 'ACTIVE' ? <Badge tone="rose">{b.status === 'ON_HOLD' ? 'On hold' : 'Exited'}</Badge> : null}
              {b.hasDisability ? <Badge tone="violet">Disability</Badge> : null}
              {b.vulnerabilityFlags.map((v) => <Badge key={v} tone="amber">{v}</Badge>)}
              {!b.consentGiven ? <Badge tone="rose"><AlertTriangle className="h-3 w-3" /> No consent recorded</Badge> : null}
            </div>
          </div>
          {edit ? (
            <div className="flex gap-2">
              <LinkButton href={`/beneficiaries/${b.id}/edit`} variant="secondary"><Pencil className="h-4 w-4" /> Edit</LinkButton>
              {can(user.role, 'beneficiaries:delete') ? (
                <InlineAction action={deleteBeneficiary} hidden={{ id: b.id }} confirm={`Permanently delete ${b.code} and all notes? Use this only for data-deletion requests or duplicates.`}>
                  <button className={buttonClass('danger')} aria-label="Delete record"><Trash2 className="h-4 w-4" /></button>
                </InlineAction>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Journey</p>
          <StageStepper id={b.id} stage={b.stage} canEdit={edit} />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Case notes" description="A running record of visits, progress and concerns.">
            {edit ? <div className="mb-5"><NoteForm beneficiaryId={b.id} /></div> : null}
            {b.notes.length ? (
              <ol className="relative space-y-5 border-l border-slate-200 pl-5">
                {b.notes.map((n) => (
                  <li key={n.id} className="relative">
                    <span className="absolute -left-[27px] top-1"><Avatar name={n.author.name} src={n.author.image} size="sm" /></span>
                    <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{n.author.name}</span> · {formatDate(n.createdAt, true)}</p>
                    <p className="prose-text mt-1">{n.body}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-slate-500">No notes yet.</p>}
          </Card>

          <Card title="Interventions" description="Field reports that included this person" actions={edit ? <Link href={`/field-reports?new=1&beneficiary=${b.id}`} className="text-sm font-medium text-brand-600 hover:underline">Log intervention</Link> : null}>
            {b.fieldReports.length ? (
              <ul className="divide-y divide-slate-100">
                {b.fieldReports.map((r) => (
                  <li key={r.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">{humanize(r.type)}</span><span className="text-xs text-slate-500">{formatDate(r.date)}</span></div>
                    <p className="line-clamp-2 text-slate-600">{r.summary}</p>
                    <p className="text-xs text-slate-400">{r.staff.name} · {humanize(r.outcome)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No interventions recorded yet.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-2.5 text-sm">
              {facts.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right text-slate-800">{v}</dd></div>)}
            </dl>
            {b.healthConditions || b.disabilityDetails ? (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                {b.disabilityDetails ? <p><span className="font-medium">Disability:</span> {b.disabilityDetails}</p> : null}
                {b.healthConditions ? <p><span className="font-medium">Health:</span> {b.healthConditions}</p> : null}
              </div>
            ) : null}
          </Card>

          <Card title="Identity documents">
            <ul className="space-y-2.5">
              {DOC_TYPES.map((d) => {
                const doc = b.idDocuments.find((x) => x.type === d.type);
                return (
                  <li key={d.type} className="flex items-center justify-between gap-2 text-sm">
                    <span>{d.label}{doc?.number ? <span className="block text-xs text-slate-400">No. {doc.number}</span> : null}</span>
                    <DocStatusSelect beneficiaryId={b.id} type={d.type} status={doc?.status ?? 'MISSING'} disabled={!edit} />
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="Stage history">
            {b.stageChanges.length ? (
              <ul className="space-y-2 text-sm">
                {b.stageChanges.map((c) => (
                  <li key={c.id}>
                    <p>{stageLabel(c.fromStage)} → <span className="font-medium">{stageLabel(c.toStage)}</span></p>
                    <p className="text-xs text-slate-400">{c.changedBy?.name ?? 'System'} · {timeAgo(c.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">Still at their first stage.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
