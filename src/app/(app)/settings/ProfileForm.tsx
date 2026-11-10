'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input, Textarea } from '@/components/ui';
import { updateProfile } from './actions';

export default function ProfileForm({ user }: { user: { name: string; phone: string | null; bio: string | null; skills: string[] } }) {
  return (
    <ActionForm action={updateProfile} className="space-y-4">
      {(s) => (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" error={s.fieldErrors?.name} required>
              <Input name="name" defaultValue={user.name} />
            </Field>
            <Field label="Phone" name="phone" error={s.fieldErrors?.phone}>
              <Input name="phone" type="tel" defaultValue={user.phone ?? ''} placeholder="07xx xxx xxx" />
            </Field>
          </div>
          <Field label="About you" name="bio" hint="Shown on your member profile.">
            <Textarea name="bio" rows={3} defaultValue={user.bio ?? ''} />
          </Field>
          <Field label="Skills" name="skills" hint="Comma separated, e.g. Counselling, First aid, Swahili">
            <Input name="skills" defaultValue={user.skills.join(', ')} />
          </Field>
          <Field label="Profile photo" name="avatar" hint="PNG, JPG or WebP up to 10 MB." error={s.fieldErrors?.avatar}>
            <input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100" />
          </Field>
          <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
