'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { inputClass } from '@/components/ui';
import { addSite } from './actions';

export default function SiteForm() {
  return (
    <ActionForm action={addSite} resetOnSuccess className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input name="name" placeholder="New site name, e.g. Kibera" aria-label="Site name" className={inputClass} />
      <input name="description" placeholder="Description (optional)" aria-label="Site description" className={inputClass} />
      <SubmitButton>Add</SubmitButton>
    </ActionForm>
  );
}
