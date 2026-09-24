-- TG Car Vibes — initial schema, row-level security and storage.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ─── Tables ────────────────────────────────────────────────────────────────

create table public.cars (
  id           uuid primary key default gen_random_uuid(),
  model        text not null,
  year         int  not null,
  category     text not null check (category in ('Hatch', 'Sedan', 'SUV', '7-seater', 'Van')),
  seats        int  not null default 5,
  bags         text not null default '3',
  fuel         text not null default 'Petrol',
  gearbox      text not null default 'Auto',
  weekly_rate  numeric(10, 2) not null check (weekly_rate > 0),
  plate        text unique,
  status       text not null default 'available' check (status in ('available', 'hire', 'service')),
  rego_expiry  date,
  service_due  date,
  odometer     int,
  photo_url    text,
  listed       boolean not null default true,   -- shown on the public website
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  -- international digits without "+", e.g. 61412558203 (matches auth.users.phone)
  phone       text not null unique check (phone ~ '^61[0-9]{9}$'),
  licence_no  text,
  created_at  timestamptz not null default now()
);

create table public.rentals (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars (id),
  customer_id  uuid not null references public.customers (id),
  start_date   date not null,
  end_date     date,
  weekly_rate  numeric(10, 2) not null,
  bond_amount  numeric(10, 2) not null,
  bond_status  text not null default 'held' check (bond_status in ('pending', 'held', 'refunded')),
  created_at   timestamptz not null default now()
);
-- a car can only be on one open rental at a time
create unique index rentals_one_open_per_car on public.rentals (car_id) where end_date is null;
create index rentals_customer_idx on public.rentals (customer_id);

create table public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  rental_id          uuid not null references public.rentals (id) on delete cascade,
  due_date           date not null,
  amount             numeric(10, 2) not null,
  paid_on            date,
  customer_notified  boolean not null default false,
  reminded_on        date,       -- last SMS reminder sent by the cron job
  created_at         timestamptz not null default now(),
  unique (rental_id, due_date)
);
create index invoices_unpaid_idx on public.invoices (due_date) where paid_on is null;

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- ─── Helpers ───────────────────────────────────────────────────────────────

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Customers sign in with phone OTP; their auth phone identifies their customer row.
create or replace function public.current_customer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.customers
  where phone = regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
    and coalesce(auth.jwt() ->> 'phone', '') <> '';
$$;

-- "I've transferred": the only write a customer can make.
create or replace function public.notify_paid(p_invoice uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.invoices i set customer_notified = true
  from public.rentals r
  where i.id = p_invoice and r.id = i.rental_id
    and r.customer_id = public.current_customer_id()
    and i.paid_on is null;
  if not found then raise exception 'Invoice not found'; end if;
end;
$$;

-- ─── Public fleet (website) ────────────────────────────────────────────────
-- Only non-sensitive columns; no plates, rego or odometer.
create or replace view public.public_cars as
  select id, model, year, category, seats, bags, fuel, gearbox, weekly_rate, status, photo_url, sort_order
  from public.cars where listed;

-- ─── Row-level security ────────────────────────────────────────────────────

alter table public.cars      enable row level security;
alter table public.customers enable row level security;
alter table public.rentals   enable row level security;
alter table public.invoices  enable row level security;
alter table public.admins    enable row level security;

create policy "admin all cars" on public.cars for all using (public.is_admin()) with check (public.is_admin());
create policy "customer reads own car" on public.cars for select using (
  exists (select 1 from public.rentals r where r.car_id = cars.id and r.customer_id = public.current_customer_id())
);

create policy "admin all customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "customer reads self" on public.customers for select using (id = public.current_customer_id());

create policy "admin all rentals" on public.rentals for all using (public.is_admin()) with check (public.is_admin());
create policy "customer reads own rentals" on public.rentals for select using (customer_id = public.current_customer_id());

create policy "admin all invoices" on public.invoices for all using (public.is_admin()) with check (public.is_admin());
create policy "customer reads own invoices" on public.invoices for select using (
  exists (select 1 from public.rentals r where r.id = invoices.rental_id and r.customer_id = public.current_customer_id())
);

create policy "read own admin row" on public.admins for select using (user_id = auth.uid());

grant select on public.public_cars to anon, authenticated;
grant execute on function public.notify_paid(uuid) to authenticated;

-- ─── Storage: car photos ───────────────────────────────────────────────────

insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

create policy "public read car photos" on storage.objects for select using (bucket_id = 'car-photos');
create policy "admin upload car photos" on storage.objects for insert with check (bucket_id = 'car-photos' and public.is_admin());
create policy "admin update car photos" on storage.objects for update using (bucket_id = 'car-photos' and public.is_admin());
create policy "admin delete car photos" on storage.objects for delete using (bucket_id = 'car-photos' and public.is_admin());
