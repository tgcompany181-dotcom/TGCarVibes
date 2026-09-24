export const BUSINESS = {
  name: 'TG Car Vibes',
  ownerName: process.env.NEXT_PUBLIC_OWNER_NAME || 'Tony',
  ownerPhone: '0451 688 698',
  location: 'Bankstown Square NSW 2200',
  payId: process.env.NEXT_PUBLIC_PAYID || 'pay@tgcarvibes.com.au',
  accountName: process.env.NEXT_PUBLIC_ACCOUNT_NAME || 'TG Car Vibes Pty Ltd',
  minWeeks: 8,
  bondWeeks: 2,
  timeZone: 'Australia/Sydney',
} as const;

export const telHref = 'tel:0451688698';
export const smsHref = 'sms:0451688698';
export const waHref = 'https://wa.me/61451688698';

export const CATEGORIES = ['Hatch', 'Sedan', 'SUV', '7-seater', 'Van'] as const;

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * supabase — Supabase Postgres + Auth (phone OTP)
 * local    — data kept in a JSON file on this server (DATA_DIR); admin password from ADMIN_PASSWORD,
 *            customers sign in with mobile + PIN set by the admin
 * demo     — in-memory dummy data, public demo logins
 */
export type DataMode = 'supabase' | 'local' | 'demo';
export const dataMode = (): DataMode =>
  isSupabaseConfigured() ? 'supabase' : process.env.ADMIN_PASSWORD ? 'local' : 'demo';
