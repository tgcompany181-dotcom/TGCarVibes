import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { isSupabaseConfigured } from './config';
import { SESSION_COOKIE, verifySession } from './session';
import { createSupabaseServer } from './supabase/server';

export type Session = { role: 'admin' } | { role: 'customer'; customerId: string } | { role: 'unlinked'; phone: string };

/** Who is signed in. Cached per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) {
    const v = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
    if (v === 'admin') return { role: 'admin' };
    if (v?.startsWith('customer:')) return { role: 'customer', customerId: v.slice(9) };
    return null;
  }
  const sb = await createSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data: admin } = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (admin) return { role: 'admin' };
  const { data: customerId } = await sb.rpc('current_customer_id');
  if (customerId) return { role: 'customer', customerId: customerId as string };
  return { role: 'unlinked', phone: user.phone ?? '' };
});

export async function requireAdmin() {
  const s = await getSession();
  if (s?.role !== 'admin') redirect('/admin/login');
}

export async function requireCustomer(): Promise<string> {
  const s = await getSession();
  if (s?.role !== 'customer') redirect('/my/login');
  return s.customerId;
}
