import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pin, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can, visibleAudiences } from '@/lib/permissions';
import { Avatar, Badge, Card, buttonClass } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { formatDate, timeAgo } from '@/lib/format';
import CommentForm from './CommentForm';
import { deleteAnnouncement, deleteComment, togglePin } from '../actions';

export default async function AnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser('dashboard:view');
  const { id } = await params;
  const a = await prisma.announcement.findFirst({
    where: { id, audience: { in: visibleAudiences(user.role) } },
    include: {
      author: { select: { name: true, image: true, position: true } },
      comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true, image: true } } } },
    },
  });
  if (!a) notFound();
  const moderator = can(user.role, 'announcements:moderate');

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/announcements" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Noticeboard</Link>
      <Card>
        <div className="flex items-start gap-3">
          <Avatar name={a.author.name} src={a.author.image} />
          <div className="flex-1">
            <p className="text-sm font-semibold">{a.author.name}</p>
            <p className="text-xs text-slate-500">{a.author.position ?? ''} · {formatDate(a.createdAt, true)}</p>
          </div>
          <div className="flex gap-2">
            {moderator ? (
              <InlineAction action={togglePin} hidden={{ id: a.id }}>
                <button className={buttonClass('secondary', 'sm')}><Pin className="h-3.5 w-3.5" /> {a.pinned ? 'Unpin' : 'Pin'}</button>
              </InlineAction>
            ) : null}
            {moderator || a.authorId === user.id ? (
              <InlineAction action={deleteAnnouncement} hidden={{ id: a.id }} confirm="Delete this announcement and its comments?">
                <button className={buttonClass('danger', 'sm')} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </InlineAction>
            ) : null}
          </div>
        </div>
        <h1 className="mt-5 flex items-center gap-2 text-2xl font-bold">{a.title} {a.pinned ? <Badge tone="leaf">Pinned</Badge> : null}</h1>
        <div className="prose-text mt-3 text-base">{a.body}</div>
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">Comments ({a.comments.length})</h2>
      <div className="space-y-3">
        {a.comments.map((c) => (
          <div key={c.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <Avatar name={c.author.name} src={c.author.image} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm"><span className="font-semibold">{c.author.name}</span> <span className="text-xs text-slate-400">· {timeAgo(c.createdAt)}</span></p>
              <p className="prose-text mt-1">{c.body}</p>
            </div>
            {moderator || c.authorId === user.id ? (
              <InlineAction action={deleteComment} hidden={{ id: c.id }} confirm="Delete this comment?">
                <button className="text-slate-400 hover:text-rose-600" aria-label="Delete comment"><Trash2 className="h-4 w-4" /></button>
              </InlineAction>
            ) : null}
          </div>
        ))}
        {can(user.role, 'comments:post') ? <Card><CommentForm announcementId={a.id} /></Card> : null}
      </div>
    </div>
  );
}
