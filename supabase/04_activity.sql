-- =====================================================================
-- Wessal Contacts — 04: approval workflow + activity log
-- ---------------------------------------------------------------------
-- RUN THIS AFTER 01_schema.sql. It is ADDITIVE: it never drops or
-- recreates the contacts table, so your existing data stays safe and
-- you can run it as many times as you like.
--
-- What it adds:
--   1. change_requests  — a member's proposed edit, waiting for the
--                         admin's approval.
--   2. activity_log     — an audit trail of every change made by
--                         anybody (members and admins), written by a
--                         database trigger so it cannot be bypassed.
--   3. Tighter rules on contacts: from now on only an admin can
--      UPDATE a contact directly. A member edits by submitting a
--      change request instead.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. change_requests — proposed edits awaiting approval
-- ---------------------------------------------------------------------
create table if not exists public.change_requests (
  id                    bigint generated always as identity primary key,
  contact_id            uuid references public.contacts(id) on delete cascade,
  contact_name          text not null default '',
  payload               jsonb not null default '{}'::jsonb,  -- the new values
  diff                  jsonb not null default '{}'::jsonb,  -- field -> {from,to}
  requested_by          uuid references auth.users(id) on delete set null,
  requested_by_username text not null default '',
  status                text not null default 'pending'
                          check (status in ('pending','approved','rejected')),
  reviewed_by           uuid references auth.users(id) on delete set null,
  reviewed_by_username  text not null default '',
  review_note           text not null default '',
  created_at            timestamptz not null default now(),
  reviewed_at           timestamptz
);

create index if not exists change_requests_status_idx
  on public.change_requests (status, created_at desc);

-- ---------------------------------------------------------------------
-- 2. activity_log — who changed what, and when
-- ---------------------------------------------------------------------
create table if not exists public.activity_log (
  id             bigint generated always as identity primary key,
  contact_id     uuid,
  contact_name   text not null default '',
  action         text not null,          -- create | update | delete | approve | reject
  details        jsonb not null default '{}'::jsonb,
  actor_username text not null default '',
  actor_role     text not null default '',
  created_at     timestamptz not null default now()
);

create index if not exists activity_log_created_idx
  on public.activity_log (created_at desc);

-- A contact remembers who touched it last (shown under the name).
alter table public.contacts
  add column if not exists updated_by_name text not null default '';

-- ---------------------------------------------------------------------
-- 3. Helpers
-- ---------------------------------------------------------------------

-- Field-by-field difference between two contact rows.
create or replace function public.contact_diff(old_row public.contacts, new_row public.contacts)
returns jsonb
language plpgsql
immutable
as $$
declare
  d jsonb := '{}'::jsonb;
begin
  if old_row.name is distinct from new_row.name then
    d := d || jsonb_build_object('name', jsonb_build_object('from', old_row.name, 'to', new_row.name));
  end if;
  if old_row.organization is distinct from new_row.organization then
    d := d || jsonb_build_object('organization', jsonb_build_object('from', old_row.organization, 'to', new_row.organization));
  end if;
  if old_row.phone is distinct from new_row.phone then
    d := d || jsonb_build_object('phone', jsonb_build_object('from', old_row.phone, 'to', new_row.phone));
  end if;
  if old_row.phone_secondary is distinct from new_row.phone_secondary then
    d := d || jsonb_build_object('phone_secondary', jsonb_build_object('from', old_row.phone_secondary, 'to', new_row.phone_secondary));
  end if;
  if old_row.has_whatsapp is distinct from new_row.has_whatsapp then
    d := d || jsonb_build_object('has_whatsapp', jsonb_build_object('from', old_row.has_whatsapp, 'to', new_row.has_whatsapp));
  end if;
  if old_row.category is distinct from new_row.category then
    d := d || jsonb_build_object('category', jsonb_build_object('from', old_row.category, 'to', new_row.category));
  end if;
  if old_row.notes is distinct from new_row.notes then
    d := d || jsonb_build_object('notes', jsonb_build_object('from', old_row.notes, 'to', new_row.notes));
  end if;
  return d;
end;
$$;

-- Username + role of the signed-in user (NULL when nobody is signed in).
create or replace function public.current_actor()
returns table (username text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select p.username, p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- 4. Triggers — the log is written by the database, not the browser
-- ---------------------------------------------------------------------

create or replace function public.log_contact_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  text;
  v_role   text;
  v_action text;
  v_name   text;
  v_id     uuid;
  v_detail jsonb := '{}'::jsonb;
begin
  select username, role into v_actor, v_role from public.current_actor();
  v_actor := coalesce(v_actor, 'unknown');
  v_role  := coalesce(v_role, '');

  if tg_op = 'INSERT' then
    v_action := 'create';
    v_name   := coalesce(nullif(new.name, ''), new.organization, '');
    v_id     := new.id;
    v_detail := jsonb_build_object(
      'phone',    new.phone,
      'category', new.category,
      'whatsapp', new.has_whatsapp
    );
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_name   := coalesce(nullif(new.name, ''), new.organization, '');
    v_id     := new.id;
    v_detail := public.contact_diff(old, new);
  else
    v_action := 'delete';
    v_name   := coalesce(nullif(old.name, ''), old.organization, '');
    v_id     := old.id;
    v_detail := jsonb_build_object(
      'phone',    old.phone,
      'category', old.category,
      'whatsapp', old.has_whatsapp
    );
  end if;

  insert into public.activity_log
    (contact_id, contact_name, action, details, actor_username, actor_role)
  values
    (v_id, v_name, v_action, v_detail, v_actor, v_role);

  return coalesce(new, old);
end;
$$;

drop trigger if exists contacts_log_change on public.contacts;
create trigger contacts_log_change
  after insert or update or delete on public.contacts
  for each row execute function public.log_contact_change();

-- Approving or rejecting a request is an event worth logging too.
create or replace function public.log_change_request_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text;
  v_role  text;
begin
  if new.status = old.status then
    return new;
  end if;

  select username, role into v_actor, v_role from public.current_actor();
  v_actor := coalesce(v_actor, 'unknown');
  v_role  := coalesce(v_role, '');

  insert into public.activity_log
    (contact_id, contact_name, action, details, actor_username, actor_role)
  values
    (
      new.contact_id,
      new.contact_name,
      case when new.status = 'approved' then 'approve' else 'reject' end,
      jsonb_build_object(
        'requested_by', new.requested_by_username,
        'note',         new.review_note,
        'diff',         new.diff
      ),
      v_actor,
      v_role
    );

  return new;
end;
$$;

drop trigger if exists change_requests_log_review on public.change_requests;
create trigger change_requests_log_review
  after update on public.change_requests
  for each row execute function public.log_change_request_review();

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------

alter table public.change_requests enable row level security;
alter table public.activity_log    enable row level security;

-- ---------- contacts: only admins may change a contact directly ----------

-- Members edit by sending a change request instead.
drop policy if exists "contacts_update_authenticated" on public.contacts;
create policy "contacts_update_admin_only" on public.contacts
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- change_requests ----------

-- The admin sees every request; a member sees only their own.
drop policy if exists "change_requests_select" on public.change_requests;
create policy "change_requests_select" on public.change_requests
  for select to authenticated
  using (public.is_admin() or requested_by = auth.uid());

-- Anyone signed in may send a request, but only for themselves.
drop policy if exists "change_requests_insert" on public.change_requests;
create policy "change_requests_insert" on public.change_requests
  for insert to authenticated
  with check (requested_by = auth.uid() or public.is_admin());

-- Only the admin may approve or reject a request.
drop policy if exists "change_requests_update_admin" on public.change_requests;
create policy "change_requests_update_admin" on public.change_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "change_requests_delete_admin" on public.change_requests;
create policy "change_requests_delete_admin" on public.change_requests
  for delete to authenticated
  using (public.is_admin());

-- ---------- activity_log ----------

-- The log is read-only and only the admin may read it. It is written by
-- the triggers above, never by the browser.
drop policy if exists "activity_log_select_admin" on public.activity_log;
create policy "activity_log_select_admin" on public.activity_log
  for select to authenticated
  using (public.is_admin());

drop policy if exists "activity_log_no_client_write" on public.activity_log;
create policy "activity_log_no_client_write" on public.activity_log
  for insert to authenticated
  with check (false);

drop policy if exists "activity_log_no_client_update" on public.activity_log;
create policy "activity_log_no_client_update" on public.activity_log
  for update to authenticated
  using (false)
  with check (false);

drop policy if exists "activity_log_no_client_delete" on public.activity_log;
create policy "activity_log_no_client_delete" on public.activity_log
  for delete to authenticated
  using (false);

-- ---------------------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------------------

revoke all on table public.change_requests from anon;
revoke all on table public.activity_log    from anon;

grant select, insert                 on table public.change_requests to authenticated;
grant update, delete                 on table public.change_requests to authenticated;
grant select                         on table public.activity_log    to authenticated;
revoke insert, update, delete       on table public.activity_log    from authenticated;

grant usage on schema public to authenticated;

-- ---------------------------------------------------------------------
-- 7. Realtime — the admin's badge updates the moment a member sends
--    a change request.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'change_requests'
  ) then
    alter publication supabase_realtime add table public.change_requests;
  end if;
exception
  when undefined_object then
    null;  -- the publication does not exist in this project; skip it
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Report
-- ---------------------------------------------------------------------
select 'change_requests' as table_name, count(*) as rows from public.change_requests
union all
select 'activity_log', count(*) from public.activity_log;
