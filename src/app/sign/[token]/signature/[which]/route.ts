import { getRepo } from '@/lib/data';

/** Signature images of a signed contract, visible to whoever holds the signing link. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; which: string }> }) {
  const { token, which } = await params;
  const repo = getRepo();
  const c = await repo.getContractByToken?.(token);
  const file = c?.status === 'signed' ? (which === 'insurance' ? c.insuranceSignature : which === 'final' ? c.finalSignature : undefined) : undefined;
  const buf = file ? await repo.readDocument?.(file) : null;
  if (!buf) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' } });
}
