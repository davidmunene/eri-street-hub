'use client';

import Image from 'next/image';
import { signOut } from 'next-auth/react';
import PasswordForm from './PasswordForm';

export default function ForcePasswordChange({ name }: { name: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-surface p-8 shadow-sm">
        <Image src="/logo.png" alt="" width={44} height={44} className="rounded-lg bg-white p-0.5" />
        <h1 className="mt-5 text-xl font-bold">Welcome, {name.split(' ')[0]}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-600">
          For your security, please replace the temporary password you were given with one only you know.
        </p>
        <PasswordForm onDone={() => window.location.assign('/')} />
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="mt-6 text-sm text-slate-500 hover:text-slate-800">Sign out</button>
      </div>
    </main>
  );
}
