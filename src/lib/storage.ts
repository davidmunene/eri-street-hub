import 'server-only';
import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ActionError } from '@/lib/session';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = [
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export type StoredFile = { url: string; name: string; size: number; type: string };

/**
 * Stores an uploaded file. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise the local ./uploads folder, served via /api/files (signed-in users only).
 */
export async function storeFile(file: File, folder: string, opts: { imagesOnly?: boolean } = {}): Promise<StoredFile> {
  if (file.size === 0) throw new ActionError('The selected file is empty.');
  if (file.size > MAX_UPLOAD_BYTES) throw new ActionError('Files must be 10 MB or smaller.');
  const allowed = opts.imagesOnly ? ALLOWED.filter((t) => t.startsWith('image/')) : ALLOWED;
  if (!allowed.includes(file.type)) throw new ActionError(`Files of type "${file.type || 'unknown'}" are not allowed.`);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80) || 'file';
  const key = `${folder}/${randomUUID()}-${safeName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, file, { access: 'public', contentType: file.type });
    return { url: blob.url, name: file.name, size: file.size, type: file.type };
  }

  const dest = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return { url: `/api/files/${key}`, name: file.name, size: file.size, type: file.type };
}

export function fileFromForm(fd: FormData, name: string): File | null {
  const f = fd.get(name);
  return f instanceof File && f.size > 0 ? f : null;
}
