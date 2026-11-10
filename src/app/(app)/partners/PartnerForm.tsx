'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input, Select, Textarea } from '@/components/ui';
import Collapsible from '@/components/Collapsible';
import { savePartner } from './actions';

export const PARTNER_TYPES = ['Health facility', 'Rehabilitation centre', 'Government office', 'Children\'s home / shelter', 'NGO / CBO', 'Faith organisation', 'School / training', 'Business / employer', 'Donor', 'Other'];
type P = { id: string; name: string; type: string; services: string | null; contactPerson: string | null; phone: string | null; email: string | null; siteId: string | null; notes: string | null };

export default function PartnerForm({ sites, partner }: { sites: { id: string; name: string }[]; partner?: P }) {
  return (
    <Collapsible label={partner ? 'Edit' : 'Add partner'} title={partner ? `Edit ${partner.name}` : 'Add partner'}>
      {(close) => (
        <ActionForm action={savePartner} onSuccess={close} className="space-y-4">
          {(s) => (
            <>
              {partner ? <input type="hidden" name="id" value={partner.id} /> : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Organisation" name="name" error={s.fieldErrors?.name} required><Input name="name" defaultValue={partner?.name} /></Field>
                <Field label="Type" name="type"><Select name="type" defaultValue={partner?.type ?? PARTNER_TYPES[0]} options={PARTNER_TYPES.map((t) => ({ value: t, label: t }))} /></Field>
                <Field label="Contact person" name="contactPerson"><Input name="contactPerson" defaultValue={partner?.contactPerson ?? ''} /></Field>
                <Field label="Phone" name="phone"><Input name="phone" type="tel" defaultValue={partner?.phone ?? ''} /></Field>
                <Field label="Email" name="email" error={s.fieldErrors?.email}><Input name="email" type="email" defaultValue={partner?.email ?? ''} /></Field>
                <Field label="Nearest site" name="siteId"><Select name="siteId" placeholder="—" defaultValue={partner?.siteId ?? ''} options={sites.map((x) => ({ value: x.id, label: x.name }))} /></Field>
              </div>
              <Field label="Services offered" name="services" hint="What can we refer people for?"><Textarea name="services" rows={2} defaultValue={partner?.services ?? ''} /></Field>
              <Field label="Referral notes" name="notes" hint="Process, requirements, opening hours"><Textarea name="notes" rows={2} defaultValue={partner?.notes ?? ''} /></Field>
              <div className="flex justify-end"><SubmitButton>Save</SubmitButton></div>
            </>
          )}
        </ActionForm>
      )}
    </Collapsible>
  );
}
