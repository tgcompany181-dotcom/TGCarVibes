'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CONTRACT_SECTIONS, FINAL_DECLARATION, INSURANCE_ACK, RENTER_FIELDS } from '@/lib/contract-terms';
import { getRepo } from '@/lib/data';
import { sendMail } from '@/lib/mailer';
import { recordFailure, tooManyAttempts } from '@/lib/session';
import type { ContractRenter } from '@/lib/types';

export type SignResult = { ok: true } | { ok: false; error: string };

const MAX_SIG_BYTES = 400 * 1024;

function decodeSignature(v: FormDataEntryValue | null): Buffer | null {
  const s = String(v ?? '');
  const prefix = 'data:image/png;base64,';
  if (!s.startsWith(prefix)) return null;
  const buf = Buffer.from(s.slice(prefix.length), 'base64');
  // PNG magic number + size limit
  if (buf.length < 100 || buf.length > MAX_SIG_BYTES || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return buf;
}

/** Public: the renter signs their contract from the emailed/texted link. */
export async function signContract(token: string, form: FormData): Promise<SignResult> {
  const repo = getRepo();
  if (!repo.getContractByToken || !repo.saveContract || !repo.saveDocument) return { ok: false, error: 'Online signing is not available.' };

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  if (tooManyAttempts('sign:' + ip, 20)) return { ok: false, error: 'Too many attempts. Please try again later.' };

  const contract = await repo.getContractByToken(token);
  if (!contract) return { ok: false, error: 'This link is not valid.' };
  if (contract.status === 'signed') return { ok: false, error: 'This agreement has already been signed.' };
  if (contract.status !== 'sent') return { ok: false, error: 'This agreement is no longer available. Please contact TG Car Vibes.' };

  const renter = {} as ContractRenter;
  for (const [key, label, required] of RENTER_FIELDS) {
    const v = String(form.get('renter-' + key) ?? '').trim().slice(0, 300);
    if (required && !v) return { ok: false, error: `Please fill in: ${label}` };
    renter[key] = v;
  }
  if (form.get('agreeInsurance') !== 'on') return { ok: false, error: 'Please tick the insurance acknowledgement (clause 7).' };
  if (form.get('agreeFinal') !== 'on') return { ok: false, error: 'Please tick the final declaration.' };
  const sigInsurance = decodeSignature(form.get('sigInsurance'));
  const sigFinal = decodeSignature(form.get('sigFinal'));
  if (!sigInsurance) return { ok: false, error: 'Please sign the insurance acknowledgement (clause 7).' };
  if (!sigFinal) return { ok: false, error: 'Please sign at the end of the agreement.' };

  recordFailure('sign:' + ip); // counts towards the per-IP limit
  const signedAt = new Date().toISOString();
  const [insuranceSignature, finalSignature] = await Promise.all([
    repo.saveDocument(new File([new Uint8Array(sigInsurance)], 'signature.png', { type: 'image/png' }), 'png'),
    repo.saveDocument(new File([new Uint8Array(sigFinal)], 'signature.png', { type: 'image/png' }), 'png'),
  ]);
  const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
  const hash = createHash('sha256')
    .update(
      JSON.stringify({
        termsVersion: contract.termsVersion,
        terms: CONTRACT_SECTIONS,
        insuranceAck: INSURANCE_ACK,
        finalDeclaration: FINAL_DECLARATION,
        details: contract.details,
        renter,
        signedAt,
        signatures: [sha(sigInsurance), sha(sigFinal)],
      }),
    )
    .digest('hex');

  await repo.saveContract({
    ...contract,
    status: 'signed',
    renter,
    signedAt,
    signerIp: ip,
    signerAgent: (h.get('user-agent') ?? '').slice(0, 300),
    insuranceSignature,
    finalSignature,
    hash,
  });
  revalidatePath('/admin', 'layout');

  try {
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'tgcarvibes.com';
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const link = `${proto}://${host}/admin/contracts/${contract.id}`;
    await sendMail(
      `Contract signed: ${renter.fullName} — ${contract.details.vehicleRego}`,
      `${renter.fullName} signed the rental agreement for ${contract.details.vehicleRego} (${contract.details.vehicleDescription}).\n\nView: ${link}`,
      `<p style="font-family:Arial,sans-serif"><b>${renter.fullName.replace(/</g, '&lt;')}</b> signed the rental agreement for <b>${contract.details.vehicleRego.replace(/</g, '&lt;')}</b>.<br><a href="${link}">View the signed agreement</a></p>`,
    );
  } catch (e) {
    console.error('Could not send contract email', e);
  }
  return { ok: true };
}
