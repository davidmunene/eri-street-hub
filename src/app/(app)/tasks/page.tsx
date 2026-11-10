import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, cn } from '@/components/ui';
import { toDateInput } from '@/lib/format';
import TaskBoard from './TaskBoard';

export const metadata: Metadata = { title: 'Tasks' };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser('tasks:view');
  const filter = (await searchParams).filter ?? 'all';
  const where = filter === 'mine' ? { assigneeId: user.id } : filter === 'unassigned' ? { assigneeId: null } : {};
  const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000);

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      // Hide tasks finished more than two weeks ago to keep the board focused.
      where: { ...where, OR: [{ status: { not: 'DONE' } }, { completedAt: { gte: twoWeeksAgo } }] },
      orderBy: [{ priority: 'desc' }, { dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      include: { assignee: { select: { id: true, name: true, image: true } }, creator: { select: { name: true } } },
    }),
    prisma.user.findMany({ where: { status: 'ACTIVE', role: { not: 'VIEWER' } }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Tasks" description="Who is doing what. Drag cards between columns, or use the menu on each card." />
      <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
        {[['all', 'All tasks'], ['mine', 'Assigned to me'], ['unassigned', 'Unassigned']].map(([k, l]) => (
          <Link key={k} href={k === 'all' ? '/tasks' : `/tasks?filter=${k}`} className={cn('rounded-md px-3 py-1.5 font-medium', filter === k ? 'bg-white shadow-sm' : 'text-slate-600')}>{l}</Link>
        ))}
      </div>
      <TaskBoard
        members={members}
        tasks={tasks.map((t) => ({
          id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
          dueDate: t.dueDate?.toISOString() ?? null, dueInput: toDateInput(t.dueDate), assignee: t.assignee, creator: t.creator.name,
        }))}
      />
    </>
  );
}
