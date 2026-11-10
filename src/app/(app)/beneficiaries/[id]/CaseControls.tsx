'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Textarea, cn } from '@/components/ui';
import { STAGES } from '@/lib/format';
import { addCaseNote, changeStage, setDocumentStatus } from '../actions';

export function StageStepper({ id, stage, canEdit }: { id: string; stage: string; canEdit: boolean }) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(stage);
  const [error, setError] = useState('');
  const idx = STAGES.findIndex((s) => s.id === current);
  return (
    <div>
      <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={!canEdit || pending}
              title={s.description}
              onClick={() => {
                if (s.id === current) return;
                if (!confirm(`Move to “${s.label}”?`)) return;
                const prev = current;
                setCurrent(s.id);
                start(async () => { const r = await changeStage(id, s.id); if (r.error) { setCurrent(prev); setError(r.error); } else setError(''); });
              }}
              className={cn('flex h-full w-full flex-col items-start rounded-lg border px-2.5 py-2 text-left text-xs transition disabled:cursor-default',
                i < idx && 'border-leaf-200 bg-leaf-50 text-leaf-700',
                i === idx && 'border-brand-500 bg-primary text-white',
                i > idx && 'border-slate-200 bg-surface text-slate-500',
                canEdit && i !== idx && 'hover:border-brand-300')}
            >
              <span className="flex items-center gap-1 font-semibold">{i < idx ? <Check className="h-3 w-3" /> : null}{i + 1}. {s.short}</span>
            </button>
          </li>
        ))}
      </ol>
      {pending ? <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function DocStatusSelect({ beneficiaryId, type, status, disabled }: { beneficiaryId: string; type: string; status: string; disabled?: boolean }) {
  return (
    <form action={setDocumentStatus}>
      <input type="hidden" name="beneficiaryId" value={beneficiaryId} />
      <input type="hidden" name="type" value={type} />
      <select
        name="status" defaultValue={status} disabled={disabled} aria-label={`${type} status`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={cn('rounded-md border-0 py-1 pl-2 pr-7 text-xs font-medium ring-1 ring-inset focus:ring-2 focus:ring-brand-500',
          status === 'OBTAINED' ? 'bg-leaf-50 text-leaf-700 ring-leaf-200' : status === 'IN_PROCESS' ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-rose-50 text-rose-700 ring-rose-200')}
      >
        <option value="MISSING">Missing</option>
        <option value="IN_PROCESS">In process</option>
        <option value="OBTAINED">Obtained</option>
      </select>
    </form>
  );
}

export function NoteForm({ beneficiaryId }: { beneficiaryId: string }) {
  return (
    <ActionForm action={addCaseNote} resetOnSuccess className="space-y-2">
      {(s) => (
        <>
          <input type="hidden" name="beneficiaryId" value={beneficiaryId} />
          <label htmlFor="body" className="sr-only">New case note</label>
          <Textarea name="body" rows={3} placeholder="Add a case note: visit, progress, concern, next step…" />
          {s.fieldErrors?.body ? <p className="text-xs text-rose-600">{s.fieldErrors.body}</p> : null}
          <div className="flex justify-end"><SubmitButton size="sm">Add note</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}
