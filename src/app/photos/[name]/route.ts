import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { photoDir } from '@/lib/data/local';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

/** Serves car photos uploaded in LOCAL mode. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const m = /^[a-z0-9-]+\.(jpg|png|webp|gif)$/i.exec(name);
  if (!m) return new Response('Not found', { status: 404 });
  try {
    const buf = await readFile(path.join(photoDir(), name));
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': TYPES[m[1].toLowerCase()], 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
