'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { DEMO_COOKIE, requireCustomer } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/config';
import { getRepo } from '@/lib/data';
import { DEMO_OTP, demoRepo } from '@/lib/data/demo';
import { toIntlPhone } from '@/lib/format';
import { createSupabaseServer } from '@/lib/supabase/server';

export type LoginState = { step: 'phone' | 'code'; phone: string; error?: string };

export async function customerLogin(prev: LoginState, form: FormData): Promise<LoginState> {
  const rawPhone = String(form.get('phone') ?? prev.phone ?? '');
  const phone = toIntlPhone(rawPhone);
  if (!phone) return { step: 'phone', phone: rawPhone, error: 'Enter your Australian mobile number, e.g. 0412 345 678.' };

  // Step 1: send the SMS code
  if (prev.step === 'phone' || form.get('resend')) {
    if (isSupabaseConfigured()) {
      const sb = await createSupabaseServer();
      const { error } = await sb.auth.signInWithOtp({ phone: '+' + phone });
      if (error) return { step: 'phone', phone: rawPhone, error: 'Could not send the code. Please try again in a minute.' };
    }
    return { step: 'code', phone: rawPhone };
  }

  // Step 2: verify
  const code = String(form.get('code') ?? '').replace(/\D/g, '');
  if (code.length < 6) return { step: 'code', phone: rawPhone, error: 'Enter the 6-digit code from the SMS.' };

  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServer();
    const { error } = await sb.auth.verifyOtp({ phone: '+' + phone, token: code, type: 'sms' });
    if (error) return { step: 'code', phone: rawPhone, error: 'That code is wrong or has expired.' };
  } else {
    const data = await demoRepo.adminData();
    const customer = data.customers.find((c) => c.phone === phone);
    if (!customer) return { step: 'phone', phone: rawPhone, error: 'We could not find a rental for this number.' };
    if (code !== DEMO_OTP) return { step: 'code', phone: rawPhone, error: `Demo mode: the code is ${DEMO_OTP}.` };
    (await cookies()).set(DEMO_COOKIE, 'customer:' + customer.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  redirect('/my');
}

export async function signOut(area: 'customer' | 'admin') {
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServer();
    await sb.auth.signOut();
  } else {
    (await cookies()).delete(DEMO_COOKIE);
  }
  redirect(area === 'admin' ? '/admin/login' : '/my/login');
}

export async function notifyTransferred(invoiceId: string) {
  const customerId = await requireCustomer();
  await getRepo().notifyPaid(customerId, invoiceId);
  revalidatePath('/my', 'layout');
}
