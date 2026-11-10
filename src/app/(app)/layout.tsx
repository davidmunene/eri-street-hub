import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/permissions';
import AppShell from '@/components/AppShell';
import ForcePasswordChange from './settings/ForcePasswordChange';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.mustChangePassword) return <ForcePasswordChange name={user.name} />;

  const [tasks, suggestions] = await Promise.all([
    prisma.task.count({ where: { assigneeId: user.id, status: { not: 'DONE' } } }),
    can(user.role, 'suggestions:review') ? prisma.suggestion.count({ where: { status: 'NEW' } }) : 0,
  ]);

  return (
    <AppShell user={{ name: user.name, email: user.email, role: user.role, position: user.position, image: user.image }} badges={{ tasks, suggestions }}>
      {children}
    </AppShell>
  );
}
