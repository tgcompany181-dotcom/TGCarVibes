'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCustomer } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';
import { getRepo } from '@/lib/data';
import { toIntlPhone } from '@/lib/format';
import { checkPin, clearFailures, recordFailure, SESSION_COOKIE, signSession, tooManyAttempts } from '@/lib/session';
import { createSupabaseServer } from '@/lib/supabase/server';

/** step "pin": mobile + PIN (local/demo). steps "phone" → "code": SMS one-time code (Supabase). */
export type LoginState = { step: 'phone' | 'code' | 'pin'; phone: string; error?: string };

const cookieOpts = (maxAge: number) => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge });

export async function customerLogin(prev: LoginState, form: FormData): Promise<LoginState> {
  const rawPhone = String(form.get('phone') ?? prev.phone ?? '');
  const phone = toIntlPhone(rawPhone);
  const back = prev.step === 'pin' ? 'pin' : 'phone';
  if (!phone) return { step: back, phone: rawPhone, error: 'Enter your Australian mobile number, e.g. 0412 345 678.' };

  // ── Local / demo: mobile + PIN ──
  if (!isSupabaseConfigured()) {
    const pin = String(form.get('pin') ?? '').replace(/\D/g, '');
    const key = 'pin:' + phone;
    if (tooManyAttempts(key)) return { step: 'pin', phone: rawPhone, error: 'Too many attempts. Please wait 15 minutes or call us.' };
    const found = await getRepo().findCustomerByPhone!(phone);
    if (!found || !checkPin(pin, found.pinHash)) {
      recordFailure(key);
      return { step: 'pin', phone: rawPhone, error: 'Mobile number or PIN is not right.' };
    }
    clearFailures(key);
    const s = signSession('customer:' + found.id);
    (await cookies()).set(SESSION_COOKIE, s.value, cookieOpts(s.maxAge));
    redirect('/my');
  }

  // ── Supabase: SMS code ──
  if (prev.step === 'phone' || form.get('resend')) {
    const sb = await createSupabaseServer();
    const { error } = await sb.auth.signInWithOtp({ phone: '+' + phone });
    if (error) return { step: 'phone', phone: rawPhone, error: 'Could not send the code. Please try again in a minute.' };
    return { step: 'code', phone: rawPhone };
  }
  const code = String(form.get('code') ?? '').replace(/\D/g, '');
  if (code.length < 6) return { step: 'code', phone: rawPhone, error: 'Enter the 6-digit code from the SMS.' };
  const sb = await createSupabaseServer();
  const { error } = await sb.auth.verifyOtp({ phone: '+' + phone, token: code, type: 'sms' });
  if (error) return { step: 'code', phone: rawPhone, error: 'That code is wrong or has expired.' };
  redirect('/my');
}

export async function signOut(area: 'customer' | 'admin') {
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServer();
    await sb.auth.signOut();
  } else {
    (await cookies()).delete(SESSION_COOKIE);
  }
  redirect(area === 'admin' ? '/admin/login' : '/my/login');
}

export async function notifyTransferred(invoiceId: string) {
  const customerId = await requireCustomer();
  await getRepo().notifyPaid(customerId, invoiceId);
  revalidatePath('/my', 'layout');
}
