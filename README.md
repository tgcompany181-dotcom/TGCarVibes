# TG Car Vibes

Long-term car rental web app for TG Car Vibes (Bankstown Square NSW 2200). Built from the design handoff.

- **Public website** `/` — fleet with weekly rate + bond (no totals), booking request via WhatsApp / phone.
- **Customer app** `/my` — sign in with phone OTP; next payment, PayID details, “I’ve transferred”, payment history, contact.
- **Admin** `/admin` — overview KPIs, fleet (add/edit, photo upload, status), customers (new hire / end hire), payments (mark paid / undo, WhatsApp reminder), compliance (rego & service).

Stack: Next.js 15 (App Router, TypeScript, server actions) · Supabase (Postgres + Auth + Storage) · Vercel (hosting + cron).

## Run locally (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase variables set the app runs in **demo mode** on in-memory dummy data (resets on restart):

- Customer: `/my` → mobile `0412 558 203`, code `123456`
- Admin: `/admin` → `admin@demo.local` / `demo`

## Local mode (data on your own server)

Set `ADMIN_PASSWORD` (and `SESSION_SECRET`, 16+ random characters) without the Supabase variables and the app keeps
everything in `DATA_DIR/db.json` (default `./data`, git-ignored) with car photos in `DATA_DIR/photos`.

- Admin signs in at `/admin` with username `ADMIN_EMAIL` (default `admin`) and `ADMIN_PASSWORD`.
- Customers sign in at `/my` with their mobile + a 6-digit PIN. Create/reset a PIN in Admin → Customers → Edit
  (shown once, with buttons to text it to the customer).
- Back up `DATA_DIR` regularly — it is the whole database.

## Go live with Supabase

1. Create a Supabase project. In the SQL editor run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql` (the 11 current cars — no plates/dates; fill them in from Admin → Fleet → Edit).
2. **Auth → Providers**: enable **Phone** (connect Twilio or another SMS provider) for customers, and **Email** for the admin.
3. **Auth → Users**: create the admin user (email + password), then run
   `insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';`
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and the PayID / account name.
5. Deploy to Vercel with the same env vars. `vercel.json` runs `/api/cron/daily` every morning (Sydney) to create weekly invoices and — if `TWILIO_*` is set — text reminders 1 day before due and when overdue.

Customers are added by the admin (Customers → **+ New hire**) with their mobile; that number is what they sign in with. Row-level security lets customers read only their own rental, car and invoices; the only thing they can write is “I’ve transferred” (via the `notify_paid` function). The public site reads the `public_cars` view, which exposes no plates, rego or odometer.

## Deploy on your own VPS (Ubuntu + nginx + PM2)

Needs Node.js 20+ and PM2 (`npm i -g pm2`). The app listens on port **3005** (change it in `ecosystem.config.cjs` if taken).

```bash
git clone https://github.com/tgcompany181-dotcom/TGCarVibes.git /var/www/tgcarvibes
cd /var/www/tgcarvibes
cp .env.example .env.local   # fill in Supabase etc. (empty = demo mode)
./deploy/update.sh           # install, build, start with PM2
pm2 startup                  # run the printed command once, so it restarts on reboot
```

nginx: copy `deploy/nginx-tgcarvibes.conf` to `/etc/nginx/sites-available/tgcarvibes`, set your domain, then
`ln -s /etc/nginx/sites-available/tgcarvibes /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx`
and add HTTPS with `certbot --nginx -d your-domain`.

Daily job (replaces Vercel Cron): `crontab -e` and add
`0 8 * * * curl -fsS -H "Authorization: Bearer <CRON_SECRET>" http://127.0.0.1:3005/api/cron/daily > /dev/null`
(the VPS clock may be UTC — adjust the hour to 8am Sydney).

To update later: `cd /var/www/tgcarvibes && ./deploy/update.sh`.

## Business rules (from the handoff)

- Minimum hire 8 weeks; bond = 2 weeks’ rent, refundable. All cars petrol, automatic.
- Never show a total rental price; insurance is not mentioned on the public site.
- Weekly invoice every 7 days from the pick-up date. Status: `paid_on` set → Paid; `due_date < today` → Overdue; else Due in N days. Dates use Sydney time.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run typecheck`

Gallery photos are from Unsplash (credited on the page) — replace with the owner’s own photos when available.
