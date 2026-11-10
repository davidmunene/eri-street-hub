'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Field, Input, Button } from '@/components/ui';
import { FormMessage } from '@/components/forms';

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await signIn('credentials', { email: fd.get('email'), password: fd.get('password'), redirect: false });
    if (res?.ok && !res.error) {
      window.location.assign(callbackUrl);
    } else {
      setPending(false);
      setError('Incorrect email or password, or your account is inactive.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Field label="Email" name="email">
        <Input name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Password" name="password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
