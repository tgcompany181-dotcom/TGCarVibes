import 'server-only';
import nodemailer from 'nodemailer';
import { BUSINESS } from './config';
import { fmtShort } from './dates';
import { money } from './format';
import type { NewBookingRequest } from './types';

/*
 * Email notifications to the owner. Configure in .env.local:
 *   SMTP_USER=you@gmail.com   SMTP_PASS=<Google app password>   NOTIFY_EMAIL=where to send (defaults to SMTP_USER)
 *   SMTP_HOST / SMTP_PORT default to Gmail (smtp.gmail.com:465).
 */

export const emailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
export const notifyAddress = () => process.env.NOTIFY_EMAIL || process.env.SMTP_USER || '';

function transport() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS?.replace(/\s+/g, '') },
  });
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export async function sendMail(subject: string, text: string, html: string) {
  if (!emailConfigured()) return false;
  await transport().sendMail({
    from: `"${BUSINESS.name} website" <${process.env.SMTP_USER}>`,
    to: notifyAddress(),
    subject,
    text,
    html,
  });
  return true;
}

/** Tells the owner about a new booking request. Documents are not attached — they stay on the server. */
export async function notifyNewRequest(r: NewBookingRequest, siteUrl: string) {
  const rows: [string, string][] = [
    ['Car', `${r.car} · ${money(r.weeklyRate)}/week`],
    ['Dates', `${fmtShort(r.pickDate)} → ${fmtShort(r.returnDate)}`],
    ['Name', r.name],
    ['Mobile', r.phone],
    ...r.answers.map((a) => [a.question, a.answer] as [string, string]),
    ['Documents', (r.documents ?? []).map((d) => d.label).join(', ') || '—'],
    ...(r.message ? ([['Message', r.message]] as [string, string][]) : []),
  ];
  const link = `${siteUrl}/admin/requests`;
  const subject = `${r.waitlist ? 'Waitlist' : 'New booking'} request: ${r.name} — ${r.car}`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nOpen in admin: ${link}`;
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#201e1d">
      <h2 style="margin:0 0 12px;color:#ec3013">${esc(subject)}</h2>
      <table style="border-collapse:collapse">${rows
        .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#605d5d;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`)
        .join('')}</table>
      <p style="margin-top:20px"><a href="${esc(link)}" style="background:#ec3013;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">View request &amp; documents</a></p>
      <p style="color:#605d5d;font-size:13px">Call ${esc(r.name)}: <a href="tel:${esc(r.phone.replace(/[^\d+]/g, ''))}">${esc(r.phone)}</a></p>
    </div>`;
  return sendMail(subject, text, html);
}
