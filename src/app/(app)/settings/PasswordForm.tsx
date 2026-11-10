'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input } from '@/components/ui';
import { changePassword } from './actions';

export default function PasswordForm({ onDone }: { onDone?: () => void }) {
  return (
    <ActionForm action={changePassword} resetOnSuccess onSuccess={onDone} className="space-y-4">
      {(s) => (
        <>
          <Field label="Current password" name="currentPassword" error={s.fieldErrors?.currentPassword}>
            <Input name="currentPassword" type="password" autoComplete="current-password" />
          </Field>
          <Field label="New password" name="newPassword" hint="At least 10 characters, with letters and numbers." error={s.fieldErrors?.newPassword}>
            <Input name="newPassword" type="password" autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password" name="confirmPassword" error={s.fieldErrors?.confirmPassword}>
            <Input name="confirmPassword" type="password" autoComplete="new-password" />
          </Field>
          <SubmitButton pendingText="Updating…">Update password</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
