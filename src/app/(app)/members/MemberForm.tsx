'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input, Select } from '@/components/ui';
import Collapsible from '@/components/Collapsible';
import { resetPassword, saveMember } from './actions';

const ROLES = [
  { value: 'MEMBER', label: 'Member: volunteers & general members' },
  { value: 'STAFF', label: 'Field staff: caseworkers & officers' },
  { value: 'OFFICIAL', label: 'Official: chair, treasurer, secretary…' },
  { value: 'VIEWER', label: 'Viewer: donors & observers (read-only)' },
  { value: 'ADMIN', label: 'Administrator: full control' },
];

type Member = { id: string; name: string; email: string; role: string; position: string | null; phone: string | null; siteId: string | null; status: string };

export default function MemberForm({ sites, member }: { sites: { id: string; name: string }[]; member?: Member }) {
  return (
    <Collapsible label={member ? 'Edit member' : 'Add member'}>
      {() => (
        <ActionForm action={saveMember} className="space-y-4" resetOnSuccess={!member}>
          {(s) => (
            <>
              {member ? <input type="hidden" name="id" value={member.id} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="name" error={s.fieldErrors?.name} required><Input name="name" defaultValue={member?.name} /></Field>
                <Field label="Email" name="email" error={s.fieldErrors?.email} required><Input name="email" type="email" defaultValue={member?.email} /></Field>
                <Field label="Phone" name="phone"><Input name="phone" type="tel" defaultValue={member?.phone ?? ''} /></Field>
                <Field label="Position / title" name="position" hint="e.g. Treasurer, Field Officer"><Input name="position" defaultValue={member?.position ?? ''} /></Field>
                <Field label="Access level" name="role" className="sm:col-span-2"><Select name="role" options={ROLES} defaultValue={member?.role ?? 'MEMBER'} /></Field>
                <Field label="Site" name="siteId"><Select name="siteId" placeholder="—" options={sites.map((x) => ({ value: x.id, label: x.name }))} defaultValue={member?.siteId ?? ''} /></Field>
                {member ? (
                  <Field label="Status" name="status"><Select name="status" defaultValue={member.status} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive (cannot sign in)' }]} /></Field>
                ) : null}
              </div>
              {!member ? <p className="text-xs text-slate-500">A temporary password will be generated. The member must choose their own the first time they sign in.</p> : null}
              <div className="flex justify-end pt-2"><SubmitButton pendingText="Saving…">{member ? 'Save changes' : 'Create account'}</SubmitButton></div>
            </>
          )}
        </ActionForm>
      )}
    </Collapsible>
  );
}

export function ResetPasswordForm({ id }: { id: string }) {
  return (
    <ActionForm action={resetPassword}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="secondary" size="sm" pendingText="Resetting…">Reset password</SubmitButton>
    </ActionForm>
  );
}
