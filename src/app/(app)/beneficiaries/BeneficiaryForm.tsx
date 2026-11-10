'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Checkbox, Field, Input, Select, Textarea, buttonClass, cn } from '@/components/ui';
import { VULNERABILITY_FLAGS } from '@/lib/validation';
import type { ActionState } from '@/lib/actions';

export type BeneficiaryDefaults = Partial<{
  id: string; legalName: string; alias: string; gender: string; dateOfBirth: string; estimatedAge: number | null; phone: string;
  siteId: string; caseworkerId: string; hasDisability: boolean; disabilityDetails: string; hasHealthcare: boolean; healthConditions: string;
  householdSize: number | null; caregiverName: string; caregiverRelation: string; caregiverPhone: string; vulnerabilityFlags: string[];
  consentGiven: boolean; status: string; birthCertificate: string; nationalId: string; nationalIdNumber: string; shaCard: string;
}>;

const STEPS = ['Personal', 'Identity documents', 'Health & needs', 'Family & consent'];
// Which fields live on which step, so errors can send the user back to the right one.
const STEP_FIELDS: string[][] = [
  ['legalName', 'alias', 'gender', 'dateOfBirth', 'estimatedAge', 'phone', 'siteId', 'caseworkerId'],
  ['birthCertificate', 'nationalId', 'nationalIdNumber', 'shaCard'],
  ['hasDisability', 'disabilityDetails', 'hasHealthcare', 'healthConditions', 'vulnerabilityFlags'],
  ['householdSize', 'caregiverName', 'caregiverRelation', 'caregiverPhone', 'consentGiven', 'initialNote'],
];
const DOC_STATUS = [{ value: 'MISSING', label: 'Does not have it' }, { value: 'IN_PROCESS', label: 'Application in process' }, { value: 'OBTAINED', label: 'Has it' }];

export default function BeneficiaryForm({ action, sites, staff, defaults = {} }: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  sites: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  defaults?: BeneficiaryDefaults;
}) {
  const [step, setStep] = useState(0);
  const [hasDisability, setHasDisability] = useState(!!defaults.hasDisability);
  const editing = !!defaults.id;
  const last = STEPS.length - 1;

  return (
    <ActionForm action={action} className="space-y-6">
      {(s) => {
        const errorStep = s.fieldErrors ? STEP_FIELDS.findIndex((f) => f.some((k) => s.fieldErrors?.[k])) : -1;
        const e = (k: string) => s.fieldErrors?.[k];
        return (
          <>
            {editing ? <input type="hidden" name="id" value={defaults.id} /> : null}
            <JumpToError state={s} step={errorStep} onJump={setStep} />
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STEPS.map((label, i) => {
                const hasError = !!s.fieldErrors && STEP_FIELDS[i].some((k) => s.fieldErrors?.[k]);
                return (
                <li key={label}>
                  <button type="button" onClick={() => setStep(i)} className={cn('flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
                    hasError ? 'border-rose-400 bg-rose-50 font-semibold text-rose-700'
                      : i === step ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700' : 'border-slate-200 bg-surface text-slate-600 hover:bg-slate-50')}>
                    <span className={cn('flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs',
                      hasError ? 'bg-danger text-white' : i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-slate-100')}>
                      {hasError ? '!' : i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="truncate">{label}</span>
                  </button>
                </li>
                );
              })}
            </ol>

            <div className="rounded-xl border border-slate-200 bg-surface p-6 shadow-sm">
              {/* All steps stay mounted (hidden) so every value is submitted together. */}
              <div className={cn('grid gap-5 sm:grid-cols-2', step !== 0 && 'hidden')}>
                <Field label="Full legal name" name="legalName" error={e('legalName')} required><Input name="legalName" defaultValue={defaults.legalName} autoComplete="off" /></Field>
                <Field label="Alias / street name" name="alias" hint="What they prefer to be called"><Input name="alias" defaultValue={defaults.alias} /></Field>
                <Field label="Gender" name="gender" error={e('gender')} required>
                  <Select name="gender" placeholder="Select…" defaultValue={defaults.gender ?? ''} options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other / prefer not to say' }]} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date of birth" name="dateOfBirth" error={e('dateOfBirth')}><Input name="dateOfBirth" type="date" defaultValue={defaults.dateOfBirth} /></Field>
                  <Field label="…or estimated age" name="estimatedAge" error={e('estimatedAge')}><Input name="estimatedAge" type="number" min={0} max={120} defaultValue={defaults.estimatedAge ?? ''} /></Field>
                </div>
                <Field label="Phone (if any)" name="phone"><Input name="phone" type="tel" defaultValue={defaults.phone} /></Field>
                <Field label="Site" name="siteId"><Select name="siteId" placeholder="Select site…" defaultValue={defaults.siteId ?? ''} options={sites.map((x) => ({ value: x.id, label: x.name }))} /></Field>
                <Field label="Caseworker" name="caseworkerId" hint="Defaults to you"><Select name="caseworkerId" placeholder="Me" defaultValue={defaults.caseworkerId ?? ''} options={staff.map((x) => ({ value: x.id, label: x.name }))} /></Field>
                {editing ? (
                  <Field label="Case status" name="status"><Select name="status" defaultValue={defaults.status} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'ON_HOLD', label: 'On hold' }, { value: 'EXITED', label: 'Exited programme' }]} /></Field>
                ) : null}
                {!editing ? (
                  <Field label="Photo (optional)" name="photo" hint="Only with the person's permission" className="sm:col-span-2">
                    <input id="photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" capture="environment" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                  </Field>
                ) : null}
              </div>

              <div className={cn('grid gap-5 sm:grid-cols-2', step !== 1 && 'hidden')}>
                <p className="text-sm text-slate-600 sm:col-span-2">Identification unlocks access to healthcare, education and social protection. Track where each document stands.</p>
                <Field label="Birth certificate" name="birthCertificate"><Select name="birthCertificate" options={DOC_STATUS} defaultValue={defaults.birthCertificate ?? 'MISSING'} /></Field>
                <Field label="SHA (health insurance) card" name="shaCard"><Select name="shaCard" options={DOC_STATUS} defaultValue={defaults.shaCard ?? 'MISSING'} /></Field>
                <Field label="National ID" name="nationalId"><Select name="nationalId" options={DOC_STATUS} defaultValue={defaults.nationalId ?? 'MISSING'} /></Field>
                <Field label="ID number" name="nationalIdNumber" hint="If they have one"><Input name="nationalIdNumber" defaultValue={defaults.nationalIdNumber} /></Field>
              </div>

              <div className={cn('space-y-5', step !== 2 && 'hidden')}>
                <Checkbox name="hasDisability" label="Has a disability" defaultChecked={defaults.hasDisability} onChange={(ev) => setHasDisability(ev.currentTarget.checked)} />
                {hasDisability ? <Field label="Disability details" name="disabilityDetails"><Textarea name="disabilityDetails" rows={2} defaultValue={defaults.disabilityDetails} /></Field> : null}
                <Checkbox name="hasHealthcare" label="Has access to healthcare" description="e.g. SHA cover or regular clinic" defaultChecked={defaults.hasHealthcare} />
                <Field label="Health conditions & needs" name="healthConditions"><Textarea name="healthConditions" rows={3} defaultValue={defaults.healthConditions} /></Field>
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">Vulnerabilities</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {VULNERABILITY_FLAGS.map((f) => (
                      <label key={f} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
                        <input type="checkbox" name="vulnerabilityFlags" value={f} defaultChecked={defaults.vulnerabilityFlags?.includes(f)} className="rounded border-slate-300 text-primary" /> {f}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className={cn('grid gap-5 sm:grid-cols-2', step !== 3 && 'hidden')}>
                <Field label="Household size" name="householdSize" error={e('householdSize')}><Input name="householdSize" type="number" min={0} defaultValue={defaults.householdSize ?? ''} /></Field>
                <Field label="Caregiver / next of kin" name="caregiverName"><Input name="caregiverName" defaultValue={defaults.caregiverName} /></Field>
                <Field label="Relationship" name="caregiverRelation"><Input name="caregiverRelation" defaultValue={defaults.caregiverRelation} placeholder="Mother, uncle, friend…" /></Field>
                <Field label="Caregiver phone" name="caregiverPhone"><Input name="caregiverPhone" type="tel" defaultValue={defaults.caregiverPhone} /></Field>
                {!editing ? <Field label="Intake notes" name="initialNote" className="sm:col-span-2" hint="Circumstances, immediate needs, agreed next steps"><Textarea name="initialNote" rows={4} /></Field> : null}
                <div className={cn('rounded-lg border p-4 sm:col-span-2', e('consentGiven') ? 'border-rose-300 bg-rose-50' : 'border-leaf-100 bg-leaf-50')}>
                  <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 flex-none text-leaf-600" />
                    <Checkbox name="consentGiven" defaultChecked={defaults.consentGiven}
                      label="The person (or their guardian) agreed to Eri Street Initiative keeping this information"
                      description="Explain that it is used only to support them, is visible only to our field team, and can be deleted on request (Kenya Data Protection Act, 2019)." />
                  </div>
                  {e('consentGiven') ? <p className="mt-2 text-xs font-medium text-rose-700">{e('consentGiven')}</p> : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0} className={buttonClass('secondary')}><ChevronLeft className="h-4 w-4" /> Back</button>
              <div className="flex gap-2">
                {editing || step === last ? <SubmitButton variant="success" pendingText="Saving…">{editing ? 'Save changes' : 'Complete intake'}</SubmitButton> : null}
                {step < last ? <button type="button" onClick={() => setStep((x) => x + 1)} className={buttonClass('primary')}>Next <ChevronRight className="h-4 w-4" /></button> : null}
              </div>
            </div>
          </>
        );
      }}
    </ActionForm>
  );
}

/** After a failed submit, show the first step that has a problem. */
function JumpToError({ state, step, onJump }: { state: ActionState; step: number; onJump: (n: number) => void }) {
  useEffect(() => {
    if (step >= 0) onJump(step);
    // Only react to a new server response, not to the user navigating steps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return null;
}
