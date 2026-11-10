import 'server-only';
import { prisma } from '@/lib/prisma';

export async function audit(
  actorId: string | null,
  action: string,
  summary: string,
  entity?: { type: string; id: string },
) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, summary, entity: entity?.type, entityId: entity?.id },
    });
  } catch (err) {
    // Auditing must never break the user's action.
    console.error('audit log failed', err);
  }
}
