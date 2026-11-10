import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, FileText, FolderOpen, Trash2, Download } from 'lucide-react';
import type { DocCategory, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can, visibleAudiences } from '@/lib/permissions';
import { Badge, EmptyState, PageHeader, cn, inputClass } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { formatBytes, formatDate } from '@/lib/format';
import UploadForm from './UploadForm';
import { deleteDocument } from './actions';
import { DOC_CATEGORIES } from './constants';

export const metadata: Metadata = { title: 'Documents' };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const user = await requireUser('dashboard:view');
  const { category, q } = await searchParams;
  const where: Prisma.DocumentWhereInput = {
    audience: { in: visibleAudiences(user.role) },
    ...(category && category in DOC_CATEGORIES ? { category: category as DocCategory } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
  };
  const docs = await prisma.document.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { uploader: { select: { name: true } } } });
  const moderator = can(user.role, 'documents:moderate');

  return (
    <>
      <PageHeader title="Documents" description="Policies, procedures, minutes, reports and templates, all in one shared library."
        actions={can(user.role, 'documents:upload') ? <UploadForm canLeadership={moderator} canTeam={user.role !== 'MEMBER'} /> : null} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1.5">
          <Link href="/documents" className={cn('rounded-full px-3 py-1 text-sm font-medium', !category ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}>All</Link>
          {Object.entries(DOC_CATEGORIES).map(([k, l]) => (
            <Link key={k} href={`/documents?category=${k}`} className={cn('rounded-full px-3 py-1 text-sm font-medium', category === k ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}>{l}</Link>
          ))}
        </div>
        <form className="lg:ml-auto lg:w-64">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <input name="q" defaultValue={q} placeholder="Search documents…" aria-label="Search documents" className={inputClass} />
        </form>
      </div>

      {docs.length === 0 ? (
        <EmptyState title="No documents found" description="Shared files and links will appear here." icon={<FolderOpen className="h-8 w-8" />} />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {docs.map((d) => {
            const href = d.fileUrl ?? d.externalUrl ?? '#';
            return (
              <li key={d.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-600"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 hover:text-brand-700 hover:underline">{d.title}</a>
                  <p className="truncate text-xs text-slate-500">
                    {DOC_CATEGORIES[d.category]} · {d.uploader.name} · {formatDate(d.createdAt)}{d.fileSize ? ` · ${formatBytes(d.fileSize)}` : ''}
                    {d.description ? ` · ${d.description}` : ''}
                  </p>
                </div>
                {d.audience !== 'EVERYONE' ? <Badge tone="violet" className="hidden sm:inline-flex">{d.audience === 'TEAM' ? 'Team' : 'Leadership'}</Badge> : null}
                <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={d.fileUrl ? 'Download' : 'Open link'}>
                  {d.fileUrl ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                </a>
                {moderator || d.uploaderId === user.id ? (
                  <InlineAction action={deleteDocument} hidden={{ id: d.id }} confirm={`Remove "${d.title}"?`}>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </InlineAction>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
