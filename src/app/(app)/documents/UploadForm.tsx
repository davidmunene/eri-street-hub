'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input, Select, Textarea } from '@/components/ui';
import Collapsible from '@/components/Collapsible';
import { uploadDocument } from './actions';
import { DOC_CATEGORIES } from './constants';

export default function UploadForm({ canLeadership, canTeam }: { canLeadership: boolean; canTeam: boolean }) {
  const audiences = [
    { value: 'EVERYONE', label: 'Everyone' },
    ...(canTeam ? [{ value: 'TEAM', label: 'Team only' }] : []),
    ...(canLeadership ? [{ value: 'LEADERSHIP', label: 'Leadership only' }] : []),
  ];
  return (
    <Collapsible label="Share document">
      {(close) => (
        <ActionForm action={uploadDocument} onSuccess={close} className="space-y-4">
          {(s) => (
            <>
              <Field label="Title" name="title" error={s.fieldErrors?.title} required><Input name="title" placeholder="e.g. Child safeguarding policy 2026" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" name="category"><Select name="category" options={Object.entries(DOC_CATEGORIES).map(([value, label]) => ({ value, label }))} defaultValue="OTHER" /></Field>
                <Field label="Visible to" name="audience"><Select name="audience" options={audiences} /></Field>
              </div>
              <Field label="Description" name="description"><Textarea name="description" rows={2} /></Field>
              <Field label="File" name="file" hint="PDF, Word, Excel, PowerPoint, images or CSV up to 10 MB." error={s.fieldErrors?.file}>
                <input id="file" name="file" type="file" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
              </Field>
              <Field label="…or a link" name="externalUrl" hint="Google Drive, Dropbox, a website…" error={s.fieldErrors?.externalUrl}><Input name="externalUrl" type="url" placeholder="https://" /></Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="px-3 text-sm text-slate-600">Cancel</button>
                <SubmitButton pendingText="Uploading…">Share</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      )}
    </Collapsible>
  );
}
