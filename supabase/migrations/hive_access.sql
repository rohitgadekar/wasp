-- Hive Extension Access Control
-- Run this in the Supabase SQL Editor

-- Table: hive_access
-- One row per user. Presence of a row does NOT mean access —
-- the `enabled` column is the gate. Only the app (via owner role) writes here.

create table if not exists public.hive_access (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  enabled     boolean not null default false,
  granted_by  uuid references public.profiles(id) on delete set null,
  granted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint hive_access_user_id_key unique (user_id)
);

-- Index for fast per-user lookups
create index if not exists hive_access_user_id_idx on public.hive_access (user_id);

-- Row Level Security
alter table public.hive_access enable row level security;

-- Any authenticated user can read their own row
create policy "Users can read own hive access"
  on public.hive_access for select
  using (auth.uid() = user_id);

-- Only owners can insert / update / delete
-- (enforced at the app layer too, but this is the DB-level hard stop)
create policy "Owners can manage hive access"
  on public.hive_access for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role = 'owner'
    )
  );

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hive_access_updated_at
  before update on public.hive_access
  for each row execute function public.set_updated_at();

-- Seed: create a disabled row for every existing profile
-- so the toggle is visible immediately in the UI
insert into public.hive_access (user_id, enabled)
select id, false
from public.profiles
on conflict (user_id) do nothing;
