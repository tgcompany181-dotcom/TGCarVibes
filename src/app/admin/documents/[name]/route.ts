import { getSession } from '@/lib/auth';
import { getRepo } from '@/lib/data';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };

/** Customer ID documents — admin only, never cached. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if ((await getSession())?.role !== 'admin') return new Response('Not found', { status: 404 });
  const { name } = await params;
  const ext = name.split('.').pop() ?? '';
  const buf = TYPES[ext] ? await getRepo().readDocument?.(name) : null;
  if (!buf) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': TYPES[ext],
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
