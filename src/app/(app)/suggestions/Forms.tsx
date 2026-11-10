'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Checkbox, Textarea, inputClass } from '@/components/ui';
import { respondSuggestion, submitSuggestion } from './actions';

export function SuggestionForm() {
  return (
    <ActionForm action={submitSuggestion} resetOnSuccess className="space-y-3">
      {(s) => (
        <>
          <label htmlFor="body" className="sr-only">Your suggestion</label>
          <Textarea name="body" rows={4} placeholder="An idea, a concern, something we could do better…" />
          {s.fieldErrors?.body ? <p className="text-xs text-rose-600">{s.fieldErrors.body}</p> : null}
          <Checkbox name="anonymous" label="Submit anonymously" description="Your name will not be stored with this suggestion." />
          <SubmitButton pendingText="Sending…">Send suggestion</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function RespondForm({ id, status, response }: { id: string; status: string; response: string | null }) {
  return (
    <ActionForm action={respondSuggestion} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      <input type="hidden" name="id" value={id} />
      <textarea name="response" defaultValue={response ?? ''} rows={2} placeholder="Response / action taken (visible to everyone)" aria-label="Response" className={inputClass} />
      <div className="flex items-center gap-2">
        <select name="status" defaultValue={status} aria-label="Status" className={`${inputClass} w-40 py-1.5`}>
          <option value="NEW">New</option><option value="REVIEWED">Reviewed</option><option value="ACTIONED">Actioned</option>
        </select>
        <SubmitButton size="sm" variant="secondary">Save</SubmitButton>
      </div>
    </ActionForm>
  );
}
