import 'server-only';
import { cache } from 'react';
import { requireAdmin } from './auth';
import { getRepo } from './data';
import { todaySydney } from './dates';

/** Loads everything the admin screens need. Also tops up weekly invoices, so the app works even if the cron job is not set up. */
export const getAdminData = cache(async () => {
  await requireAdmin();
  const repo = getRepo();
  const today = todaySydney();
  try {
    await repo.generateInvoices(today);
  } catch (e) {
    console.error('generateInvoices failed', e);
  }
  return { data: await repo.adminData(), today };
});
