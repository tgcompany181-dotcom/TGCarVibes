'use client';

import { useState, useTransition } from 'react';
import { submitBookingRequest } from '@/app/actions';
import s from '@/app/site.module.css';
import { BOOKING_QUESTIONS, DOCUMENT_KINDS, MIN_DOCUMENTS } from '@/lib/booking-questions';
import { BUSINESS, telHref } from '@/lib/config';
import { fmtShort } from '@/lib/dates';
import type { FleetGroup } from '@/lib/derive';
import { money } from '@/lib/format';

/** Step 2 of the booking dialog: contact details + questions, saved to Admin → Requests. */
export function RequestForm({
  car,
  pick,
  ret,
  periodText,
  onBack,
}: {
  car: FleetGroup;
  pick: string;
  ret: string;
  periodText: string;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const [docs, setDocs] = useState<Record<string, File | null>>({});
  const [docBusy, setDocBusy] = useState('');
  const docCount = Object.values(docs).filter(Boolean).length;
  const totalBytes = Object.values(docs).reduce((a, f) => a + (f?.size ?? 0), 0);

  const pickDoc = async (kind: string, file: File | undefined) => {
    setError('');
    if (!file) return setDocs((d) => ({ ...d, [kind]: null }));
    setDocBusy(kind);
    try {
      const ready = await prepareDocument(file);
      setDocs((d) => ({ ...d, [kind]: ready }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file');
    } finally {
      setDocBusy('');
    }
  };

  const submit = (form: FormData) =>
    start(async () => {
      setError('');
      if (docCount < MIN_DOCUMENTS) return setError(`Please add at least ${MIN_DOCUMENTS} documents.`);
      if (totalBytes > 8 * 1024 * 1024) return setError('Your files are too large together (max 8 MB). Please use photos instead of PDFs.');
      form.set('car', car.title);
      form.set('weeklyRate', String(car.weeklyRate));
      form.set('pickDate', pick);
      form.set('returnDate', ret);
      form.set('waitlist', car.available ? '0' : '1');
      for (const [kind, f] of Object.entries(docs)) if (f) form.set('doc-' + kind, f, f.name);
      try {
        const res = await submitBookingRequest(form);
        if (res.ok) setSent(true);
        else setError(res.error);
      } catch {
        setError('Could not send. Please check your connection, or call us.');
      }
    });

  if (sent) {
    return (
      <div className={s.sentBox} role="status">
        <div className={s.sentTick} aria-hidden>
          ✓
        </div>
        <div className="dialog-title">Request sent — thank you!</div>
        <p style={{ margin: 0 }}>
          {BUSINESS.ownerName} will call you soon to confirm the {car.title}. Need it sooner? Call{' '}
          <a href={telHref}>{BUSINESS.ownerPhone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form
      className={s.requestForm}
      onSubmit={(e) => {
        e.preventDefault(); // submit manually so typed answers are kept if something needs fixing
        submit(new FormData(e.currentTarget));
      }}
    >
      <div className={s.requestSummary}>
        {fmtShort(pick)} → {fmtShort(ret)} · {periodText} · {money(car.weeklyRate)}/week
      </div>
      <div className="field">
        <label htmlFor="rq-name">Your name</label>
        <input id="rq-name" name="name" className="input input-lg" autoComplete="name" required maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="rq-phone">Mobile number</label>
        <input id="rq-phone" name="phone" type="tel" className="input input-lg" autoComplete="tel" placeholder="0412 345 678" required maxLength={30} />
      </div>
      {BOOKING_QUESTIONS.map((q) =>
        q.type === 'choice' ? (
          <fieldset key={q.id} className={s.choiceSet}>
            <legend>{q.label}</legend>
            <div className={s.choiceRow}>
              {q.options.map((opt) => (
                <label key={opt} className={answers[q.id] === opt ? s.choiceOn : undefined}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    required={q.required}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <div key={q.id} className="field">
            <label htmlFor={`q-${q.id}`}>{q.label}</label>
            <input
              id={`q-${q.id}`}
              name={`q-${q.id}`}
              className="input input-lg"
              placeholder={q.placeholder}
              required={q.required}
              maxLength={500}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            />
          </div>
        ),
      )}
      <fieldset className={s.choiceSet}>
        <legend>
          Photos of your documents — at least {MIN_DOCUMENTS} of these ({docCount}/{DOCUMENT_KINDS.length} added)
        </legend>
        <div className={s.docList}>
          {DOCUMENT_KINDS.map((k) => {
            const f = docs[k.id];
            return (
              <div key={k.id} className={`${s.docSlot} ${f ? s.docDone : ''}`}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    {f ? '✓ ' : ''}
                    {k.label}
                  </div>
                  <div className={s.docHint}>{docBusy === k.id ? 'Preparing…' : f ? f.name : 'hint' in k ? k.hint : 'Take a photo or choose a file'}</div>
                </div>
                <label className={`btn ${f ? 'btn-ghost' : 'btn-secondary'} btn-sm`}>
                  {f ? 'Change' : 'Add photo'}
                  <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => pickDoc(k.id, e.target.files?.[0])} />
                </label>
              </div>
            );
          })}
        </div>
        <div className={s.docHint} style={{ marginTop: 6 }}>
          Your documents are stored privately and only seen by {BUSINESS.ownerName} to confirm your booking.
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="rq-msg">Anything else? (optional)</label>
        <textarea id="rq-msg" name="message" className="input" rows={3} maxLength={1000} />
      </div>
      {/* honeypot for spam bots — hidden from people */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" />
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className={s.dialogActions}>
        <button className="btn btn-primary btn-block btn-lg" disabled={pending}>
          {pending ? 'Sending…' : car.available ? 'Send booking request' : 'Join the waitlist'} <span aria-hidden>→</span>
        </button>
        <button type="button" className="btn btn-secondary" onClick={onBack} style={{ minHeight: 44, justifyContent: 'flex-start' }}>
          ← Back to dates
        </button>
      </div>
    </form>
  );
}

/** Shrinks photos on the phone before upload (max 1800 px, JPEG) so requests stay small; PDFs pass through. */
async function prepareDocument(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    if (file.size > 4 * 1024 * 1024) throw new Error('PDF is too large (max 4 MB) — please take a photo instead.');
    return file;
  }
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo or a PDF.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('That photo format is not supported — please take a new photo or use JPG/PNG.');
  }
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Could not read that photo.');
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}
