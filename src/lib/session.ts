import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/*
 * Signed session cookie for the local and demo modes (Supabase mode uses Supabase Auth).
 * Value: "<subject>.<expiresAtMs>.<hmac>" where subject is "admin" or "customer:<id>".
 */

export const SESSION_COOKIE = 'tg_session';
const MAX_AGE_S = 60 * 60 * 24 * 30;

const g = globalThis as unknown as { __tgSecret?: string };
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.ADMIN_PASSWORD) throw new Error('SESSION_SECRET (16+ chars) must be set');
  return (g.__tgSecret ??= randomBytes(32).toString('hex')); // demo mode only
}

const mac = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function signSession(subject: string) {
  const payload = `${subject}.${Date.now() + MAX_AGE_S * 1000}`;
  return { value: `${payload}.${mac(payload)}`, maxAge: MAX_AGE_S };
}

export function verifySession(value: string | undefined): string | null {
  if (!value) return null;
  const i = value.lastIndexOf('.');
  if (i < 0) return null;
  const payload = value.slice(0, i);
  const sig = Buffer.from(value.slice(i + 1));
  const good = Buffer.from(mac(payload));
  if (sig.length !== good.length || !timingSafeEqual(sig, good)) return null;
  const j = payload.lastIndexOf('.');
  if (Number(payload.slice(j + 1)) < Date.now()) return null;
  return payload.slice(0, j);
}

export function safeEqual(a: string, b: string) {
  const x = createHmac('sha256', 'cmp').update(a).digest();
  const y = createHmac('sha256', 'cmp').update(b).digest();
  return timingSafeEqual(x, y);
}

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pin, salt, 32).toString('hex')}`;
}

export function checkPin(pin: string, stored: string | undefined) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const a = scryptSync(pin, salt, 32);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Simple in-memory brute-force guard: max `limit` failures per key per 15 minutes. */
const fails = new Map<string, { n: number; until: number }>();
export function tooManyAttempts(key: string, limit = 5) {
  const f = fails.get(key);
  return !!f && f.until > Date.now() && f.n >= limit;
}
export function recordFailure(key: string) {
  const now = Date.now();
  const f = fails.get(key);
  if (!f || f.until < now) fails.set(key, { n: 1, until: now + 15 * 60_000 });
  else f.n++;
}
export const clearFailures = (key: string) => fails.delete(key);
