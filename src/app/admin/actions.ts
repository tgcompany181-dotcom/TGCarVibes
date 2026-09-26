'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { CATEGORIES, dataMode } from '@/lib/config';
import { getRepo } from '@/lib/data';
import { DEMO_ADMIN } from '@/lib/data/demo';
import { isISODate, todaySydney } from '@/lib/dates';
import { toIntlPhone } from '@/lib/format';
import { checkPin, clearFailures, hashPin, recordFailure, safeEqual, SESSION_COOKIE, signSession, tooManyAttempts } from '@/lib/session';
import { emailConfigured, sendMail } from '@/lib/mailer';
import { createSupabaseServer } from '@/lib/supabase/server';
import { randomBytes, randomInt } from 'node:crypto';
import { CONTRACT_VERSION } from '@/lib/contract-terms';
import type { CarInput, CarStatus, Category } from '@/lib/types';

export type ActionResult = { ok: true } | { ok: false; error: string };

const done = () => {
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
  revalidatePath('/my', 'layout');
};

async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  await requireAdmin();
  try {
    await fn();
    done();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong' };
  }
}

// ─── auth ──────────────────────────────────────────────────────────────────

export type AdminLoginState = { error: string; email: string } | null;

export async function adminLogin(_prev: AdminLoginState, form: FormData): Promise<AdminLoginState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const mode = dataMode();
  if (mode === 'supabase') {
    const sb = await createSupabaseServer();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Wrong email or password.', email };
    const { data: admin } = await sb.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (!admin) {
      await sb.auth.signOut();
      return { error: 'This account is not an admin.', email };
    }
  } else {
    if (tooManyAttempts('admin', 10)) return { error: 'Too many attempts. Please wait 15 minutes.', email };
    const stored = mode === 'local' ? await getRepo().getAdminAuth?.() : null;
    const ok =
      mode === 'local'
        ? safeEqual(email.toLowerCase(), (process.env.ADMIN_EMAIL || 'admin').toLowerCase()) &&
          (stored ? checkPin(password, stored.passwordHash) : safeEqual(password, process.env.ADMIN_PASSWORD!))
        : email === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
    if (!ok) {
      recordFailure('admin');
      return { error: 'Wrong email or password.', email };
    }
    clearFailures('admin');
    const s = signSession(`admin:${stored?.epoch ?? 0}`);
    (await cookies()).set(SESSION_COOKIE, s.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: s.maxAge,
    });
  }
  redirect('/admin');
}

// ─── payments ──────────────────────────────────────────────────────────────

export async function markPaid(invoiceId: string) {
  return run(() => getRepo().setInvoicePaid(invoiceId, todaySydney()));
}

export async function undoPaid(invoiceId: string) {
  return run(() => getRepo().setInvoicePaid(invoiceId, null));
}

// ─── fleet ─────────────────────────────────────────────────────────────────

export async function setCarStatus(carId: string, status: CarStatus) {
  if (!['available', 'hire', 'service'].includes(status)) return { ok: false, error: 'Bad status' } as ActionResult;
  return run(() => getRepo().setCarStatus(carId, status));
}

const optDate = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (!isISODate(s)) throw new Error('Invalid date: ' + s);
  return s;
};
const optInt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').replace(/[^\d]/g, '');
  return s ? Number(s) : null;
};

function parseCar(form: FormData): CarInput {
  const model = String(form.get('model') ?? '').trim();
  const year = Number(form.get('year'));
  const category = String(form.get('category')) as Category;
  const weeklyRate = Number(form.get('weeklyRate'));
  if (!model) throw new Error('Model is required');
  if (!Number.isInteger(year) || year < 1990 || year > 2100) throw new Error('Enter a valid year');
  if (!CATEGORIES.includes(category)) throw new Error('Choose a type');
  if (!(weeklyRate > 0)) throw new Error('Enter the weekly rate');
  const plate = String(form.get('plate') ?? '').toUpperCase().replace(/\s+/g, '') || null;
  return {
    model,
    year,
    category,
    seats: optInt(form.get('seats')) ?? 5,
    bags: String(form.get('bags') ?? '').trim() || '3',
    weeklyRate,
    plate,
    regoExpiry: optDate(form.get('regoExpiry')),
    serviceDue: optDate(form.get('serviceDue')),
    odometer: optInt(form.get('odometer')),
    listed: form.get('listed') === 'on',
  };
}

export async function saveCar(carId: string | null, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const repo = getRepo();
    const id = await repo.saveCar(parseCar(form), carId ?? undefined);
    const photo = form.get('photo');
    if (photo instanceof File && photo.size > 0) {
      if (!photo.type.startsWith('image/')) throw new Error('Photo must be an image');
      if (photo.size > 6 * 1024 * 1024) throw new Error('Photo must be under 6 MB');
      await repo.uploadCarPhoto(id, photo);
    }
  });
}

// ─── customers & rentals ───────────────────────────────────────────────────

export async function addCustomer(form: FormData): Promise<ActionResult> {
  return run(async () => {
    const firstName = String(form.get('firstName') ?? '').trim();
    const lastName = String(form.get('lastName') ?? '').trim();
    const phone = toIntlPhone(String(form.get('phone') ?? ''));
    const carId = String(form.get('carId') ?? '');
    const startDate = optDate(form.get('startDate'));
    const weeklyRate = Number(form.get('weeklyRate'));
    if (!firstName || !lastName) throw new Error('Enter first and last name');
    if (!phone) throw new Error('Enter a valid Australian mobile');
    if (!carId) throw new Error('Choose a car');
    if (!startDate) throw new Error('Choose the pick-up date');
    if (!(weeklyRate > 0)) throw new Error('Enter the weekly rate');
    const repo = getRepo();
    await repo.addCustomerWithRental({
      firstName,
      lastName,
      phone,
      licenceNo: String(form.get('licenceNo') ?? '').trim() || null,
      carId,
      startDate,
      weeklyRate,
    });
    await repo.generateInvoices(todaySydney());
  });
}

export async function updateCustomer(id: string, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const firstName = String(form.get('firstName') ?? '').trim();
    const lastName = String(form.get('lastName') ?? '').trim();
    const rawPhone = String(form.get('phone') ?? '').trim();
    const phone = rawPhone ? toIntlPhone(rawPhone) : null;
    if (!firstName) throw new Error('Enter the first name');
    if (rawPhone && !phone) throw new Error('Enter a valid Australian mobile');
    if (dataMode() === 'supabase' && !phone) throw new Error('Mobile is required');
    await getRepo().updateCustomer(id, { firstName, lastName, phone, licenceNo: String(form.get('licenceNo') ?? '').trim() || null });
  });
}

export async function endRental(rentalId: string, endDate: string): Promise<ActionResult> {
  return run(async () => {
    if (!isISODate(endDate)) throw new Error('Choose the return date');
    await getRepo().endRental(rentalId, endDate);
  });
}

/** Local/demo modes: create a new 6-digit PIN for a customer. Returned once so the owner can text it. */
export async function resetCustomerPin(customerId: string): Promise<{ ok: true; pin: string } | { ok: false; error: string }> {
  await requireAdmin();
  const repo = getRepo();
  if (!repo.setCustomerPin) return { ok: false, error: 'Customers sign in with an SMS code in this setup.' };
  const pin = String(randomInt(0, 1_000_000)).padStart(6, '0');
  try {
    await repo.setCustomerPin(customerId, hashPin(pin));
    return { ok: true, pin };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong' };
  }
}

export type PasswordState = { ok: boolean; message: string } | null;

/** Local mode: change the admin password from the website. Signs out every other session. */
export async function changeAdminPassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  await requireAdmin();
  const repo = getRepo();
  if (dataMode() !== 'local' || !repo.setAdminPassword) return { ok: false, message: 'Not available in this setup.' };
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  if (tooManyAttempts('admin-pw', 5)) return { ok: false, message: 'Too many attempts. Please wait 15 minutes.' };
  const stored = await repo.getAdminAuth?.();
  const currentOk = stored ? checkPin(current, stored.passwordHash) : safeEqual(current, process.env.ADMIN_PASSWORD!);
  if (!currentOk) {
    recordFailure('admin-pw');
    return { ok: false, message: 'Current password is not right.' };
  }
  if (next.length < 8) return { ok: false, message: 'New password must be at least 8 characters.' };
  if (next !== confirm) return { ok: false, message: 'The two new passwords do not match.' };
  if (next === current) return { ok: false, message: 'Choose a password different from the current one.' };
  const epoch = await repo.setAdminPassword(hashPin(next));
  clearFailures('admin-pw');
  // keep this browser signed in with the new session epoch
  const s = signSession(`admin:${epoch}`);
  (await cookies()).set(SESSION_COOKIE, s.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: s.maxAge,
  });
  return { ok: true, message: 'Password changed. Other devices have been signed out.' };
}

// ─── cover images (home page slideshow) ────────────────────────────────────

export async function addBanners(form: FormData): Promise<ActionResult> {
  return run(async () => {
    const repo = getRepo();
    if (!repo.addBanner) throw new Error('Not available in this setup.');
    const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) throw new Error('Choose at least one photo');
    for (const f of files) {
      if (!f.type.startsWith('image/')) throw new Error(`${f.name} is not an image`);
      if (f.size > 6 * 1024 * 1024) throw new Error(`${f.name} is over 6 MB`);
    }
    for (const f of files) await repo.addBanner(f);
  });
}

export async function saveBannerOrder(urls: string[]): Promise<ActionResult> {
  return run(async () => {
    const repo = getRepo();
    if (!repo.setBanners) throw new Error('Not available in this setup.');
    await repo.setBanners(urls);
  });
}

// ─── booking requests from the website ─────────────────────────────────────

export async function setRequestStatus(id: string, status: 'new' | 'contacted' | 'closed'): Promise<ActionResult> {
  if (!['new', 'contacted', 'closed'].includes(status)) return { ok: false, error: 'Bad status' };
  return run(async () => {
    const repo = getRepo();
    if (!repo.setRequestStatus) throw new Error('Not available in this setup.');
    await repo.setRequestStatus(id, status);
  });
}

/** Deletes a request and its uploaded documents. */
export async function deleteRequest(id: string): Promise<ActionResult> {
  return run(async () => {
    const repo = getRepo();
    if (!repo.deleteRequest) throw new Error('Not available in this setup.');
    await repo.deleteRequest(id);
  });
}

/** Settings → send a test email to check the email setup. */
export async function sendTestEmail(): Promise<ActionResult> {
  await requireAdmin();
  if (!emailConfigured()) return { ok: false, error: 'Email is not set up on the server yet.' };
  try {
    await sendMail(
      'TG Car Vibes — test email',
      'Email notifications are working. You will get an email for every new booking request.',
      '<p style="font-family:Arial,sans-serif">Email notifications are working ✅<br>You will get an email for every new booking request.</p>',
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Sending failed: ' + (e instanceof Error ? e.message : String(e)) };
  }
}

// ─── online contracts ──────────────────────────────────────────────────────

export async function createContract(form: FormData): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  await requireAdmin();
  const repo = getRepo();
  if (!repo.saveContract) return { ok: false, error: 'Online contracts are not available in this setup.' };
  const txt = (k: string, max = 200) => String(form.get(k) ?? '').trim().slice(0, max);
  const details = {
    renterName: txt('renterName'),
    mobile: txt('mobile', 40),
    vehicleRego: txt('vehicleRego', 20).toUpperCase(),
    vehicleDescription: txt('vehicleDescription'),
    fuelGrade: txt('fuelGrade', 40) || 'Petrol',
    startDateTime: txt('startDateTime', 40),
    endDateTime: txt('endDateTime', 40),
    weeklyRent: Number(form.get('weeklyRent')) || 0,
    paymentDay: txt('paymentDay', 40),
    bond: Number(form.get('bond')) || 0,
  };
  if (!details.renterName) return { ok: false, error: 'Enter the renter name' };
  if (!details.vehicleRego || !details.vehicleDescription) return { ok: false, error: 'Enter the vehicle details' };
  if (!details.startDateTime || !details.endDateTime) return { ok: false, error: 'Enter the start and ending dates' };
  if (!(details.weeklyRent > 0) || !(details.bond >= 0)) return { ok: false, error: 'Enter the weekly rent and bond' };
  const token = randomBytes(24).toString('hex');
  await repo.saveContract({
    id: 'k' + randomBytes(6).toString('hex'),
    token,
    customerId: txt('customerId', 40) || null,
    createdAt: new Date().toISOString(),
    status: 'sent',
    termsVersion: CONTRACT_VERSION,
    details,
  });
  revalidatePath('/admin', 'layout');
  return { ok: true, token };
}

export async function cancelContract(id: string): Promise<ActionResult> {
  return run(async () => {
    const repo = getRepo();
    const c = await repo.getContract?.(id);
    if (!c) throw new Error('Contract not found');
    if (c.status === 'signed') throw new Error('A signed contract cannot be cancelled here.');
    await repo.saveContract!({ ...c, status: 'cancelled' });
  });
}

/** TG Car Vibes countersigns an agreement the renter has already signed. */
export async function countersignContract(id: string, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const repo = getRepo();
    const c = await repo.getContract?.(id);
    if (!c || !repo.saveContract || !repo.saveDocument) throw new Error('Contract not found');
    if (c.status !== 'signed') throw new Error('The renter has not signed yet.');
    if (c.countersignedAt) throw new Error('Already countersigned.');
    const name = String(form.get('ownerName') ?? '').trim().slice(0, 100);
    const title = String(form.get('ownerTitle') ?? '').trim().slice(0, 100);
    if (!name) throw new Error('Enter your name');
    const sig = String(form.get('ownerSig') ?? '');
    const prefix = 'data:image/png;base64,';
    const buf = sig.startsWith(prefix) ? Buffer.from(sig.slice(prefix.length), 'base64') : null;
    if (!buf || buf.length < 100 || buf.length > 400 * 1024 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('Please sign in the box');
    const file = await repo.saveDocument(new File([new Uint8Array(buf)], 'signature.png', { type: 'image/png' }), 'png');
    await repo.saveContract({ ...c, ownerSignature: file, ownerName: name, ownerTitle: title, countersignedAt: new Date().toISOString() });
  });
}
