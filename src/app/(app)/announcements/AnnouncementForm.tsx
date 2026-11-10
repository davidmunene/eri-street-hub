'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui';
import Collapsible from '@/components/Collapsible';
import { createAnnouncement } from './actions';

export default function AnnouncementForm({ canModerate }: { canModerate: boolean }) {
  const audiences = [
    { value: 'EVERYONE', label: 'Everyone' },
    { value: 'TEAM', label: 'Team only (staff & leadership)' },
    ...(canModerate ? [{ value: 'LEADERSHIP', label: 'Leadership only' }] : []),
  ];
  return (
    <Collapsible label="New announcement">
      {(close) => (
        <ActionForm action={createAnnouncement} onSuccess={close} className="space-y-4">
          {(s) => (
            <>
              <Field label="Title" name="title" error={s.fieldErrors?.title} required><Input name="title" maxLength={150} /></Field>
              <Field label="Message" name="body" error={s.fieldErrors?.body} required><Textarea name="body" rows={7} /></Field>
              <Field label="Who can see this?" name="audience"><Select name="audience" options={audiences} /></Field>
              {canModerate ? <Checkbox name="pinned" label="Pin to the top of the noticeboard" /> : null}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="px-3 text-sm text-slate-600">Cancel</button>
                <SubmitButton pendingText="Posting…">Post announcement</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      )}
    </Collapsible>
  );
}
