'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { BOOKING_QUESTIONS, DOCUMENT_KINDS, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, MIN_DOCUMENTS } from '@/lib/booking-questions';
import { getRepo } from '@/lib/data';
import { daysBetween, isISODate, todaySydney } from '@/lib/dates';
import { toIntlPhone } from '@/lib/format';
import { recordFailure, tooManyAttempts } from '@/lib/session';

export type RequestResult = { ok: true } | { ok: false; error: string };

const clip = (v: FormDataEntryValue | null, n: number) => String(v ?? '').trim().slice(0, n);

/** Public: a customer sends a booking / waitlist request (with ID documents) from the website. */
export async function submitBookingRequest(form: FormData): Promise<RequestResult> {
  const repo = getRepo();
  if (!repo.addRequest || !repo.saveDocument) return { ok: false, error: 'Please call or WhatsApp us to book.' };
  if (clip(form.get('website'), 200)) return { ok: true }; // honeypot filled → bot, pretend it worked

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
  const key = 'req:' + ip;
  if (tooManyAttempts(key, 5)) return { ok: false, error: 'Too many requests. Please call us instead.' };

  const name = clip(form.get('name'), 80);
  const phone = clip(form.get('phone'), 30);
  const pickDate = clip(form.get('pickDate'), 10);
  const returnDate = clip(form.get('returnDate'), 10);
  if (name.length < 2) return { ok: false, error: 'Please enter your name.' };
  if (!toIntlPhone(phone) && phone.replace(/\D/g, '').length < 8) return { ok: false, error: 'Please enter a phone number we can call.' };
  if (!isISODate(pickDate) || !isISODate(returnDate)) return { ok: false, error: 'Please choose your dates.' };
  if (pickDate < todaySydney()) return { ok: false, error: 'Pick-up date is in the past.' };
  if (daysBetween(pickDate, returnDate) < 56) return { ok: false, error: 'Minimum hire is 8 weeks.' };

  const answers: { question: string; answer: string }[] = [];
  for (const q of BOOKING_QUESTIONS) {
    const a = clip(form.get('q-' + q.id), 500);
    if ((q.required && !a) || (q.type === 'choice' && a && !q.options.includes(a))) return { ok: false, error: `Please answer: ${q.label}` };
    if (a) answers.push({ question: q.label, answer: a });
  }

  const docs: { kind: string; label: string; file: File; ext: string }[] = [];
  for (const k of DOCUMENT_KINDS) {
    const f = form.get('doc-' + k.id);
    if (!(f instanceof File) || f.size === 0) continue;
    const ext = DOCUMENT_TYPES[f.type];
    if (!ext) return { ok: false, error: `${k.label}: please upload a photo (JPG/PNG) or PDF.` };
    if (f.size > MAX_DOCUMENT_BYTES) return { ok: false, error: `${k.label}: file is too large (max 4 MB).` };
    docs.push({ kind: k.id, label: k.label, file: f, ext });
  }
  if (docs.length < MIN_DOCUMENTS) return { ok: false, error: `Please add at least ${MIN_DOCUMENTS} documents.` };

  recordFailure(key); // counts towards the per-IP limit (5 requests per 15 min)
  const saved: { kind: string; label: string; file: string }[] = [];
  for (const d of docs) saved.push({ kind: d.kind, label: d.label, file: await repo.saveDocument(d.file, d.ext) });

  await repo.addRequest({
    car: clip(form.get('car'), 80),
    weeklyRate: Number(form.get('weeklyRate')) || 0,
    pickDate,
    returnDate,
    name,
    phone,
    answers,
    message: clip(form.get('message'), 1000),
    waitlist: form.get('waitlist') === '1',
    documents: saved,
  });
  revalidatePath('/admin', 'layout');
  return { ok: true };
}
