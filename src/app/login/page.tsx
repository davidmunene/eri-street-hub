import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/session';
import LoginForm from './LoginForm';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  if (await getCurrentUser()) redirect('/');
  const { callbackUrl } = await searchParams;
  // Only allow same-site relative redirects.
  const safeCallback = callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/';

  return (
    <main className="grid grid-cols-1 min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lime/15" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#2e9348]/30" />
        <div className="relative flex items-center gap-3">
          <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl bg-white p-1" />
          <span className="text-lg font-semibold">Eri Street Initiative</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">One home for our work <span className="text-lime">on the street.</span></h1>
          <p className="mt-4 text-white/75">
            Members, meetings, tasks, documents, finances and every beneficiary&apos;s journey,
            from first helping hand to graduation, in one shared space.
          </p>
        </div>
        <p className="relative text-sm text-white/50">Restricted system. Authorised members only.</p>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12">
        <ThemeToggle className="absolute right-4 top-4 hidden lg:inline-flex" />
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/logo.png" alt="" width={40} height={40} className="rounded-lg bg-white p-0.5" />
            <span className="font-semibold text-brand-700">Eri Street Initiative</span>
            <ThemeToggle className="ml-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-600">Use the email and password provided by your administrator.</p>
          <LoginForm callbackUrl={safeCallback} />
          <p className="mt-6 text-xs text-slate-500">Forgot your password? Ask an administrator to reset it for you.</p>
        </div>
      </div>
    </main>
  );
}
