'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Textarea } from '@/components/ui';
import { saveAttendance, saveMinutes } from '../actions';

export function AttendanceForm({ eventId, people }: { eventId: string; people: { id: string; name: string; rsvp: string | null; attended: boolean }[] }) {
  return (
    <ActionForm action={saveAttendance}>
      <input type="hidden" name="eventId" value={eventId} />
      <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
        {people.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 py-2 text-sm">
              <input type="checkbox" name="attended" value={p.id} defaultChecked={p.attended} className="h-4 w-4 rounded border-slate-300 text-primary" />
              <span className="flex-1">{p.name}</span>
              {p.rsvp ? <span className="text-xs text-slate-400">RSVP: {p.rsvp.replace('_', ' ').toLowerCase()}</span> : null}
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3"><SubmitButton size="sm">Save attendance</SubmitButton></div>
    </ActionForm>
  );
}

export function MinutesForm({ eventId, minutes }: { eventId: string; minutes: string | null }) {
  return (
    <ActionForm action={saveMinutes} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <label htmlFor="minutes" className="sr-only">Minutes</label>
      <Textarea name="minutes" rows={12} defaultValue={minutes ?? ''} placeholder={'Present: …\n\n1. Opening prayer & introductions\n2. Matters arising\n3. Treasurer\'s report\n…\n\nAction points:\n- '} />
      <SubmitButton size="sm">Save minutes</SubmitButton>
    </ActionForm>
  );
}
