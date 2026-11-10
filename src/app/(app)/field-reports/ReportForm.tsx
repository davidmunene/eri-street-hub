'use client';

import { useMemo, useState } from 'react';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input, Select, Textarea, inputClass } from '@/components/ui';
import { createFieldReport } from './actions';

const TYPES = ['FOOD', 'HEALTH', 'DOCUMENTATION', 'COUNSELLING', 'EDUCATION', 'SHELTER', 'LIVELIHOOD', 'REFERRAL', 'OTHER'];
const OUTCOMES = [{ value: 'SUCCESS', label: 'Successful' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'NEEDS_FOLLOW_UP', label: 'Needs follow-up' }, { value: 'CRITICAL', label: 'Critical: urgent attention' }];

export default function ReportForm({ sites, people, today, preselect, onDone }: {
  sites: { id: string; name: string }[]; people: { id: string; label: string }[]; today: string; preselect?: string; onDone?: () => void;
}) {
  const [filter, setFilter] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set(preselect ? [preselect] : []));
  const shown = useMemo(() => people.filter((p) => p.label.toLowerCase().includes(filter.toLowerCase())).slice(0, 100), [people, filter]);

  return (
    <ActionForm action={createFieldReport} onSuccess={() => { setPicked(new Set()); onDone?.(); }} resetOnSuccess className="space-y-4">
      {(s) => (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type" name="type"><Select name="type" options={TYPES.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))} /></Field>
            <Field label="Date" name="date" error={s.fieldErrors?.date} required><Input name="date" type="date" defaultValue={today} /></Field>
            <Field label="Site" name="siteId"><Select name="siteId" placeholder="—" options={sites.map((x) => ({ value: x.id, label: x.name }))} /></Field>
          </div>
          <Field label="What happened?" name="summary" error={s.fieldErrors?.summary} required><Textarea name="summary" rows={4} placeholder="e.g. Hot lunch for 45 people at Mlango Kubwa; 3 referred to Mbagathi Hospital." /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Outcome" name="outcome"><Select name="outcome" options={OUTCOMES} /></Field>
            <Field label="People reached" name="peopleReached" hint="Leave blank to count the people ticked below"><Input name="peopleReached" type="number" min={0} /></Field>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Registered beneficiaries involved ({picked.size})</legend>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name or case no." aria-label="Filter beneficiaries" className={`${inputClass} mt-1.5`} />
            {[...picked].map((id) => <input key={id} type="hidden" name="beneficiaryIds" value={id} />)}
            <ul className="mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {shown.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={picked.has(p.id)} onChange={(e) => setPicked((prev) => { const n = new Set(prev); if (e.target.checked) n.add(p.id); else n.delete(p.id); return n; })} className="rounded border-slate-300 text-brand-700" />
                    {p.label}
                  </label>
                </li>
              ))}
              {shown.length === 0 ? <li className="px-3 py-2 text-sm text-slate-500">No matches</li> : null}
            </ul>
          </fieldset>
          <div className="flex justify-end"><SubmitButton pendingText="Saving…">Save report</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}
