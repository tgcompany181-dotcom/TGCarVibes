import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { requireCustomer } from './auth';
import { getRepo } from './data';

/** The signed-in customer's rental, car and invoices (cached per request). */
export const getMyData = cache(async () => {
  const customerId = await requireCustomer();
  const data = await getRepo().customerData(customerId);
  if (!data) redirect('/my/login');
  return data;
});
