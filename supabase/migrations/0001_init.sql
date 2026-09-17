-- Supabase / Postgres
create table if not exists public.events (
  id text primary key,
  name text not null,
  event_type text not null,
  format text not null default '',
  date text not null,
  time text not null,
  address text not null,
  capacity integer not null check (capacity > 0),
  price integer not null check (price >= 0),
  currency text not null,
  organizers text not null default ''
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null
);

create table if not exists public.registrations (
  id uuid primary key,
  number text not null unique,
  access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  whatsapp text not null,
  occupation text,
  consent boolean not null,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null check (status in ('new','waiting_payment','receipt_received','paid','ticket_sent','waitlist','cancelled')),
  payment_status text not null check (payment_status in ('unpaid','pending','paid','refunded')),
  payment_amount integer,
  ticket_id text,
  ticket_url text,
  notes text not null default '',
  receipt_clicked_at timestamptz
);
create index if not exists registrations_status_idx on public.registrations(status);

create table if not exists public.tickets (
  id uuid primary key,
  code text not null unique,
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  event_id text not null references public.events(id),
  holder_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key,
  name text not null,
  quote text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  photo_key text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- The app talks to Supabase only from the server with the service role key.
alter table public.events enable row level security;
alter table public.settings enable row level security;
alter table public.registrations enable row level security;
alter table public.tickets enable row level security;
alter table public.testimonials enable row level security;

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- Seed current event
insert into public.events (id, name, event_type, format, date, time, address, capacity, price, currency, organizers)
values ('probezhka-beginner', 'Пробежка по ИИ-шкам', 'Beginner', 'Online Workshop',
        '2026-09-19', '15:00', 'По многочисленным просьбам теперь в онлайн.', 15, 10000, '₸', 'Таир + Тимур')
on conflict (id) do nothing;
