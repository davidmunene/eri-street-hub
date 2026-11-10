'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input, Select, Textarea } from '@/components/ui';
import Collapsible from '@/components/Collapsible';
import { saveEvent } from './actions';

const TYPES = ['MEETING', 'OUTREACH', 'TRAINING', 'FUNDRAISER', 'SOCIAL', 'OTHER'].map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));

export type EventDefaults = { id: string; title: string; description: string | null; type: string; startsAt: string; endsAt: string; venue: string | null; siteId: string | null };

export default function EventForm({ sites, event }: { sites: { id: string; name: string }[]; event?: EventDefaults }) {
  return (
    <Collapsible label={event ? 'Edit event' : 'Schedule event'}>
      {(close) => (
        <ActionForm action={saveEvent} onSuccess={close} className="space-y-4">
          {(s) => (
            <>
              {event ? <input type="hidden" name="id" value={event.id} /> : null}
              <Field label="Title" name="title" error={s.fieldErrors?.title} required><Input name="title" defaultValue={event?.title} placeholder="e.g. Monthly members' meeting" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" name="type"><Select name="type" options={TYPES} defaultValue={event?.type ?? 'MEETING'} /></Field>
                <Field label="Site" name="siteId"><Select name="siteId" placeholder="—" options={sites.map((x) => ({ value: x.id, label: x.name }))} defaultValue={event?.siteId ?? ''} /></Field>
                <Field label="Starts" name="startsAt" error={s.fieldErrors?.startsAt} required><Input name="startsAt" type="datetime-local" defaultValue={event?.startsAt} /></Field>
                <Field label="Ends" name="endsAt" error={s.fieldErrors?.endsAt}><Input name="endsAt" type="datetime-local" defaultValue={event?.endsAt} /></Field>
              </div>
              <Field label="Venue / meeting link" name="venue"><Input name="venue" defaultValue={event?.venue ?? ''} placeholder="Juja community hall, or a Google Meet link" /></Field>
              <Field label="Agenda / description" name="description"><Textarea name="description" rows={5} defaultValue={event?.description ?? ''} /></Field>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="px-3 text-sm text-slate-600">Cancel</button>
                <SubmitButton pendingText="Saving…">{event ? 'Save changes' : 'Schedule'}</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      )}
    </Collapsible>
  );
}
