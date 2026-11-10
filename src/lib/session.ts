import 'server-only';
import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can, type Permission } from '@/lib/permissions';

/**
 * Loads the signed-in user fresh from the database on every request, so that
 * role changes and deactivations take effect immediately (not when the JWT expires).
 */
export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true, status: true, position: true,
      image: true, mustChangePassword: true, siteId: true,
    },
  });
  if (!user || user.status !== 'ACTIVE') return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For pages: redirect to login if signed out; to a 403 page if not allowed. */
export async function requireUser(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (permission && !can(user.role, permission)) redirect('/forbidden');
  return user;
}

export class ActionError extends Error {}

/** For server actions: throw instead of redirect so the caller gets a message. */
export async function authorize(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ActionError('Your session has expired. Please sign in again.');
  if (!can(user.role, permission)) throw new ActionError('You do not have permission to do that.');
  return user;
}
