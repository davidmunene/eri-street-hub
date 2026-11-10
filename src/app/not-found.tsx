import { LinkButton } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">It may have been moved or deleted.</p>
      <LinkButton href="/" className="mt-6">Back to dashboard</LinkButton>
    </main>
  );
}
