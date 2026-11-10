import type { Metadata } from 'next';
import { MessageSquareHeart } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { RespondForm, SuggestionForm } from './Forms';

export const metadata: Metadata = { title: 'Suggestion box' };
const TONE = { NEW: 'sky', REVIEWED: 'amber', ACTIONED: 'leaf' } as const;

export default async function SuggestionsPage() {
  const user = await requireUser('suggestions:submit');
  const reviewer = can(user.role, 'suggestions:review');
  // Reviewers see everything; others see their own plus any that have a public response.
  const items = await prisma.suggestion.findMany({
    where: reviewer ? {} : { OR: [{ authorId: user.id }, { response: { not: null } }] },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: { author: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader title="Suggestion box" description="Every voice matters. Share ideas and concerns with the leadership, anonymously if you prefer." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Share a suggestion"><SuggestionForm /></Card>
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700">{reviewer ? 'All suggestions' : 'Your suggestions & responses'}</h2>
          {items.length === 0 ? <EmptyState title="No suggestions yet" icon={<MessageSquareHeart className="h-8 w-8" />} /> : items.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Badge tone={TONE[s.status]}>{s.status.charAt(0) + s.status.slice(1).toLowerCase()}</Badge>
                {s.anonymous ? 'Anonymous' : s.author?.name ?? 'Former member'} · {timeAgo(s.createdAt)}
              </div>
              <p className="prose-text mt-2">{s.body}</p>
              {reviewer ? <RespondForm id={s.id} status={s.status} response={s.response} /> : s.response ? (
                <div className="mt-3 rounded-lg bg-leaf-50 p-3 text-sm text-leaf-700"><span className="font-semibold">Leadership response:</span> {s.response}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
