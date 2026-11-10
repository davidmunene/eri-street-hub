import 'server-only';
import { ZodError } from 'zod';
import { ActionError } from '@/lib/session';

export type ActionState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

/**
 * Wraps a server action body: converts validation and permission errors into
 * a friendly state object for the form, and logs anything unexpected.
 */
export async function runAction(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) fieldErrors[issue.path.join('.')] ??= issue.message;
      return { error: 'Please check the highlighted fields.', fieldErrors };
    }
    if (err instanceof ActionError) return { error: err.message };
    // Let Next.js redirects / notFound propagate.
    if (err && typeof err === 'object' && 'digest' in err && String((err as { digest: unknown }).digest).startsWith('NEXT_')) throw err;
    console.error(err);
    return { error: 'Something went wrong. Please try again.' };
  }
}

/** FormData → plain object (multi-value keys become arrays). */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith('$ACTION')) continue;
    const all = fd.getAll(key).filter((v) => typeof v === 'string');
    out[key] = all.length > 1 || key.endsWith('[]') ? all : all[0];
  }
  return out;
}
