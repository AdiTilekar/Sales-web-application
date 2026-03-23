create extension if not exists pgcrypto;

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  product_id text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2),
  unit_profit numeric(10,2),
  unit_cost numeric(10,2),
  customer text,
  city text,
  created_at timestamptz not null default now()
);

alter table public.sales add column if not exists unit_price numeric(10,2);
alter table public.sales add column if not exists unit_profit numeric(10,2);
alter table public.sales add column if not exists unit_cost numeric(10,2);

alter table public.sales enable row level security;

drop policy if exists "Allow public read sales" on public.sales;
drop policy if exists "Allow public insert sales" on public.sales;
drop policy if exists "Allow public delete sales" on public.sales;
drop policy if exists "Allow authenticated delete sales" on public.sales;

create policy "Allow public read sales"
on public.sales
for select
to anon
using (true);

create policy "Allow public insert sales"
on public.sales
for insert
to anon
with check (true);

create policy "Allow authenticated delete sales"
on public.sales
for delete
to authenticated
using (true);
