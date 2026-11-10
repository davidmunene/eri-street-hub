import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getCurrentUser } from '@/lib/session';
import { LOCAL_UPLOAD_DIR } from '@/lib/storage';

const TYPES: Record<string, string> = {
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.txt': 'text/plain', '.csv': 'text/csv',
};

// Serves locally-stored uploads to signed-in users only (dev / self-hosted mode).
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { path: parts } = await params;
  const resolved = path.resolve(LOCAL_UPLOAD_DIR, ...parts);
  if (!resolved.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response('Not found', { status: 404 });

  // Beneficiary photos are only for people allowed to see beneficiary data.
  if (parts[0] === 'beneficiaries' && !['ADMIN', 'OFFICIAL', 'STAFF'].includes(user.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const data = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const type = TYPES[ext] ?? 'application/octet-stream';
    const inline = type.startsWith('image/') || type === 'application/pdf';
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${path.basename(resolved).replace(/^[0-9a-f-]{37}/, '')}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
