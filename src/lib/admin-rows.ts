import { daysBetween, fmtShort } from './dates';
import { indexAdmin, invoiceStatus, type InvoiceStatus } from './derive';
import { money, whatsappLink } from './format';
import { BUSINESS } from './config';
import type { AdminData, Invoice, ISODate } from './types';

export interface InvoiceRow {
  id: string;
  dueDate: ISODate;
  dueText: string;
  name: string;
  firstName: string;
  phone: string;
  plate: string;
  amount: number;
  amountText: string;
  status: InvoiceStatus;
  paidOn: ISODate | null;
  notified: boolean;
  lateText: string;
  reminderHref: string;
}

/** Joins an invoice with its customer and car for display. */
export function invoiceRows(data: AdminData, invoices: Invoice[], today: ISODate): InvoiceRow[] {
  const ix = indexAdmin(data, today);
  return invoices.flatMap((i) => {
    const rental = ix.rentalById.get(i.rentalId);
    const customer = rental && ix.customerById.get(rental.customerId);
    const car = rental && ix.carById.get(rental.carId);
    if (!rental || !customer) return [];
    const plate = car?.plate ?? '—';
    const late = daysBetween(i.dueDate, today);
    return [
      {
        id: i.id,
        dueDate: i.dueDate,
        dueText: fmtShort(i.dueDate),
        name: `${customer.firstName} ${customer.lastName}`,
        firstName: customer.firstName,
        phone: customer.phone,
        plate,
        amount: i.amount,
        amountText: money(i.amount),
        status: invoiceStatus(i, today),
        paidOn: i.paidOn,
        notified: i.customerNotified,
        lateText: late === 1 ? '1 day late' : `${late} days late`,
        reminderHref: whatsappLink(
          customer.phone,
          `Hi ${customer.firstName}, a reminder that your ${money(i.amount)} payment for ${plate} was due ${fmtShort(i.dueDate)}. PayID: ${BUSINESS.payId} (reference ${plate}). Thanks!`,
        ),
      },
    ];
  });
}
