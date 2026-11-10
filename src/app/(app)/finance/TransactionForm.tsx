'use client';

import { useState } from 'react';
import { ActionForm, SubmitButton } from '@/components/forms';
import { Field, Input, Select, cn } from '@/components/ui';
import Collapsible from '@/components/Collapsible';
import { TX_CATEGORIES } from '@/lib/validation';
import { recordTransaction } from './actions';

export default function TransactionForm({ members, today }: { members: { id: string; name: string }[]; today: string }) {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [category, setCategory] = useState<string>(TX_CATEGORIES.INCOME[0]);
  return (
    <Collapsible label="Record transaction">
      {() => (
        <ActionForm action={recordTransaction} resetOnSuccess className="space-y-4">
          {(s) => (
            <>
              <input type="hidden" name="type" value={type} />
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                {(['INCOME', 'EXPENSE'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { setType(t); setCategory(TX_CATEGORIES[t][0]); }}
                    className={cn('rounded-md py-2 text-sm font-semibold', type === t ? (t === 'INCOME' ? 'bg-surface text-leaf-700 shadow-sm' : 'bg-surface text-rose-700 shadow-sm') : 'text-slate-600')}>
                    {t === 'INCOME' ? 'Money in' : 'Money out'}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount (KES)" name="amount" error={s.fieldErrors?.amount} required><Input name="amount" type="number" inputMode="numeric" min={1} step={1} /></Field>
                <Field label="Date" name="date" error={s.fieldErrors?.date} required><Input name="date" type="date" defaultValue={today} /></Field>
                <Field label="Category" name="category" error={s.fieldErrors?.category}>
                  <Select name="category" value={category} onChange={(e) => setCategory(e.target.value)} options={TX_CATEGORIES[type].map((c) => ({ value: c, label: c }))} />
                </Field>
                <Field label="Reference" name="reference" hint="M-Pesa code, receipt no.">
                  <Input name="reference" placeholder="e.g. SJK4H7XQ2P" />
                </Field>
                {type === 'INCOME' ? (
                  <Field label="From member" name="memberId" hint="For dues & member contributions" className="sm:col-span-2">
                    <Select name="memberId" placeholder="Not a member payment" options={members.map((m) => ({ value: m.id, label: m.name }))} />
                  </Field>
                ) : null}
              </div>
              <Field label="Description" name="description"><Input name="description" placeholder={type === 'INCOME' ? 'e.g. March dues' : 'e.g. Lunch for 40 at Mlango Kubwa outreach'} /></Field>
              <div className="flex justify-end pt-2"><SubmitButton pendingText="Saving…">Record</SubmitButton></div>
            </>
          )}
        </ActionForm>
      )}
    </Collapsible>
  );
}
