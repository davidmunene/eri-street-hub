import { ShieldAlert } from 'lucide-react';
import { LinkButton } from '@/components/ui';

export default function Forbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <ShieldAlert className="h-12 w-12 text-amber-500" />
      <h1 className="mt-4 text-2xl font-bold">You don&apos;t have access to this page</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">Your role doesn&apos;t include this area. If you need access, ask an administrator.</p>
      <LinkButton href="/" className="mt-6">Back to dashboard</LinkButton>
    </main>
  );
}
