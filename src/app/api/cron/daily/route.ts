import { NextResponse, type NextRequest } from 'next/server';
import { BUSINESS, isSupabaseConfigured } from '@/lib/config';
import { getRepo } from '@/lib/data';
import { generateInvoicesWith } from '@/lib/data/supabase';
import { addDays, fmtShort, todaySydney } from '@/lib/dates';
import { money } from '@/lib/format';
import { sendSms, smsConfigured } from '@/lib/sms';
import { createSupabaseService } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Daily job (Vercel Cron, see vercel.json):
 *  1. creates the next weekly invoice for every active rental;
 *  2. if Twilio is configured, texts customers 1 day before a payment is due,
 *     on the first day it is overdue, and weekly while it stays overdue.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const today = todaySydney();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: getRepo().mode, created: await getRepo().generateInvoices(today) });
  }

  const sb = createSupabaseService();
  const created = await generateInvoicesWith(sb, today);

  let sent = 0;
  const failures: string[] = [];
  if (smsConfigured()) {
    const tomorrow = addDays(today, 1);
    const { data, error } = await sb
      .from('invoices')
      .select('id, due_date, amount, reminded_on, customer_notified, rentals!inner(end_date, customers!inner(first_name, phone), cars(plate))')
      .is('paid_on', null)
      .lte('due_date', tomorrow);
    if (error) return NextResponse.json({ created, error: error.message }, { status: 500 });

    for (const inv of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rental = inv.rentals as any;
      const customer = rental.customers;
      const plate = rental.cars?.plate ?? '';
      const due: string = inv.due_date;
      const last: string | null = inv.reminded_on;
      let text: string | null = null;
      if (due === tomorrow && last !== today) {
        text = `Hi ${customer.first_name}, your ${money(Number(inv.amount))} car payment is due tomorrow (${fmtShort(due)}). PayID ${BUSINESS.payId}, reference ${plate}. – ${BUSINESS.name}`;
      } else if (due < today && !inv.customer_notified && (!last || last < due || last <= addDays(today, -7))) {
        text = `Hi ${customer.first_name}, your ${money(Number(inv.amount))} car payment for ${plate} was due ${fmtShort(due)} and hasn't been received. PayID ${BUSINESS.payId}, reference ${plate}. Questions? Call ${BUSINESS.ownerName} on ${BUSINESS.ownerPhone}.`;
      }
      if (!text) continue;
      try {
        await sendSms(customer.phone, text);
        await sb.from('invoices').update({ reminded_on: today }).eq('id', inv.id);
        sent++;
      } catch (e) {
        failures.push(`${inv.id}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  return NextResponse.json({ created, sent, failures });
}
