-- =====================================================================
-- Wessal Contacts — database schema
-- ---------------------------------------------------------------------
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- It creates:
--   * contacts    table  (the directory)
--   * categories  table  (admin-managed list)
--   * profiles    table  (username + role for each account)
--   * Row Level Security policies that enforce the permissions in the
--     database itself, not just in the UI
--
-- Roles
--   member  : read, insert, update  (no delete)
--   admin   : read, insert, update, delete
--
-- IMPORTANT: this file does NOT create the two login accounts.
-- Use 02_create_accounts.sql (or the Dashboard) for that.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- Profiles: one row per account, holding the username and the role.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  role       text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

-- Categories: the admin-managed list of categories.
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- Contacts: the directory itself.
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null default '',
  organization    text not null default '',
  phone           text not null,
  phone_secondary text,
  has_whatsapp    boolean not null default true,
  category        text not null default 'Other',
  notes           text not null default '',
  created_by      uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.contacts.phone is
  'Digits only, international format without + (e.g. 201002135438).';
comment on column public.contacts.phone_secondary is
  'Optional second number, same format. NULL when not provided.';
comment on column public.contacts.has_whatsapp is
  'Whether wa.me can be used for this contact.';

-- Indexes for the common lookups (search + duplicate checks).
create index if not exists contacts_phone_idx      on public.contacts (phone);
create index if not exists contacts_phone2_idx     on public.contacts (phone_secondary);
create index if not exists contacts_category_idx   on public.contacts (category);
create index if not exists contacts_created_at_idx on public.contacts (created_at desc);

-- ---------------------------------------------------------------------
-- 2. Helper functions
-- ---------------------------------------------------------------------

-- Is the current signed-in user an admin?
-- Used by the RLS policies, so the permission decision is made by the
-- database and cannot be bypassed by editing the front-end.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Auto-update updated_at whenever a row changes.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contacts_touch_updated_at on public.contacts;
create trigger contacts_touch_updated_at
  before update on public.contacts
  for each row execute function public.touch_updated_at();

-- Keep profiles.role in sync when a profile row is created for a new
-- account. (Role itself is set by the setup script, not by the user.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------
-- With RLS enabled and NO policy for the "anon" role, a visitor who is
-- not logged in cannot read or write anything. Members and admins only
-- get the rows their role allows.

alter table public.contacts   enable row level security;
alter table public.categories enable row level security;
alter table public.profiles   enable row level security;

-- Force RLS even for the table owner (defence in depth).
alter table public.contacts   force row level security;
alter table public.categories force row level security;
alter table public.profiles   force row level security;

-- ---------- profiles ----------
-- A signed-in user may read their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Profiles are created by the setup script / trigger, never by the client.
drop policy if exists "profiles_no_client_write" on public.profiles;
create policy "profiles_no_client_write" on public.profiles
  for insert to authenticated
  with check (false);

drop policy if exists "profiles_no_client_update" on public.profiles;
create policy "profiles_no_client_update" on public.profiles
  for update to authenticated
  using (false)
  with check (false);

drop policy if exists "profiles_no_client_delete" on public.profiles;
create policy "profiles_no_client_delete" on public.profiles
  for delete to authenticated
  using (false);

-- ---------- categories ----------
-- Everyone signed in can read the list.
drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_authenticated" on public.categories
  for select to authenticated
  using (true);

-- Only admins can add / rename / remove categories.
drop policy if exists "categories_insert_admin" on public.categories;
create policy "categories_insert_admin" on public.categories
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "categories_update_admin" on public.categories;
create policy "categories_update_admin" on public.categories
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_admin" on public.categories
  for delete to authenticated
  using (public.is_admin());

-- ---------- contacts ----------
-- Everyone signed in can read the directory.
drop policy if exists "contacts_select_authenticated" on public.contacts;
create policy "contacts_select_authenticated" on public.contacts
  for select to authenticated
  using (true);

-- Members AND admins can add contacts.
drop policy if exists "contacts_insert_authenticated" on public.contacts;
create policy "contacts_insert_authenticated" on public.contacts
  for insert to authenticated
  with check (true);

-- Members AND admins can edit contacts.
drop policy if exists "contacts_update_authenticated" on public.contacts;
create policy "contacts_update_authenticated" on public.contacts
  for update to authenticated
  using (true)
  with check (true);

-- ONLY admins can delete. A member's delete request is rejected by
-- the database even if they craft the request themselves.
drop policy if exists "contacts_delete_admin_only" on public.contacts;
create policy "contacts_delete_admin_only" on public.contacts
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Grants
-- ---------------------------------------------------------------------
-- The "anon" role (not logged in) gets no access at all.
revoke all on table public.contacts   from anon;
revoke all on table public.categories from anon;
revoke all on table public.profiles   from anon;

grant select, insert, update          on table public.contacts   to authenticated;
grant delete                          on table public.contacts   to authenticated;
grant select, insert, update, delete  on table public.categories to authenticated;
grant select                          on table public.profiles   to authenticated;

grant usage on schema public to authenticated;

-- ---------------------------------------------------------------------
-- 5. Default categories
-- ---------------------------------------------------------------------
insert into public.categories (name, sort_order) values
  ('Client', 1),
  ('Organization', 2),
  ('Supplier', 3),
  ('Company', 4),
  ('Charity', 5),
  ('Other', 6)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 6. Realtime (so the team sees each other's changes immediately)
-- ---------------------------------------------------------------------
-- Only needed if the publication does not already include the table.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contacts'
  ) then
    alter publication supabase_realtime add table public.contacts;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;
end
$$;

-- =====================================================================
-- Done. Next: run 02_create_accounts.sql
-- =====================================================================
