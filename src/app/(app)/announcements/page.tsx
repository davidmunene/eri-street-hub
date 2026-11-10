import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, Megaphone, Pin } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can, visibleAudiences } from '@/lib/permissions';
import { Avatar, Badge, EmptyState, PageHeader } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import AnnouncementForm from './AnnouncementForm';

export const metadata: Metadata = { title: 'Noticeboard' };

export default async function AnnouncementsPage() {
  const user = await requireUser('dashboard:view');
  const items = await prisma.announcement.findMany({
    where: { audience: { in: visibleAudiences(user.role) } },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    include: { author: { select: { name: true, image: true, position: true } }, _count: { select: { comments: true } } },
  });

  return (
    <>
      <PageHeader
        title="Noticeboard"
        description="News, decisions and reminders for the whole organisation."
        actions={can(user.role, 'announcements:post') ? <AnnouncementForm canModerate={can(user.role, 'announcements:moderate')} /> : null}
      />
      {items.length === 0 ? (
        <EmptyState title="No announcements yet" description="Posts from the team will appear here." icon={<Megaphone className="h-8 w-8" />} />
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Link key={a.id} href={`/announcements/${a.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow">
              <div className="flex items-start gap-3">
                <Avatar name={a.author.name} src={a.author.image} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{a.title}</h2>
                    {a.pinned ? <Badge tone="leaf"><Pin className="h-3 w-3" /> Pinned</Badge> : null}
                    {a.audience !== 'EVERYONE' ? <Badge tone="violet">{a.audience === 'TEAM' ? 'Team only' : 'Leadership only'}</Badge> : null}
                  </div>
                  <p className="text-xs text-slate-500">{a.author.name}{a.author.position ? `, ${a.author.position}` : ''} · {timeAgo(a.createdAt)}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-700">{a.body}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500"><MessageSquare className="h-3.5 w-3.5" /> {a._count.comments} comment{a._count.comments === 1 ? '' : 's'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
