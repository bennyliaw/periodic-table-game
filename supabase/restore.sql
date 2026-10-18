-- Element Quest: lock down and migrate the Supabase project after it is resumed.
-- Run in the Supabase SQL editor, block by block, in order.
-- The access rules below are the protection; the public key in the app is public by design.

-- ─────────────────────────────────────────────────────────────
-- 1. FIRST ACTION after "Resume project" (paste before resuming).
--    RLS stays on with no policy = nobody can read or write. Instant.
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Public access" on eq_players;
revoke all on eq_players, eq_element_facts from anon;

-- Check (expect 0 rows / permission denied):
--   set role anon; select count(*) from eq_players; reset role;

-- ─────────────────────────────────────────────────────────────
-- 2. Safe defaults: new tables and functions are not open to the public key or signed-in users
--    unless granted explicitly below.
-- ─────────────────────────────────────────────────────────────
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- ─────────────────────────────────────────────────────────────
-- 3. Schema changes the new app needs (safe to run before rooms are mapped).
-- ─────────────────────────────────────────────────────────────
alter table eq_players add column if not exists owner_id uuid references auth.users on delete cascade;
alter table eq_players alter column owner_id set default auth.uid();
alter table eq_players add column if not exists is_adult boolean not null default false;
update eq_players set is_adult = coalesce(age >= 18, false);
alter table eq_players alter column id set default gen_random_uuid()::text;
-- Old patterns were unsalted SHA-256: discard; players draw a new one on next sign-in.
update eq_players set constellation_hash = null, auth_reset = true;

-- ─────────────────────────────────────────────────────────────
-- 4. Access rule: each family sees and changes only its own players.
-- ─────────────────────────────────────────────────────────────
create policy "family owns its players" on eq_players for all to authenticated
  using      (owner_id = (select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false)
  with check (owner_id = (select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);
revoke all on eq_players from authenticated;
grant select, insert, update, delete on eq_players to authenticated;

-- Keep-alive for the daily VPS cron: no data, the only thing the public key may call.
create or replace function public.keepalive() returns int
  language sql security invoker set search_path = '' as $$ select 1 $$;
revoke execute on function public.keepalive() from public, anon, authenticated;
grant execute on function public.keepalive() to anon;

-- ─────────────────────────────────────────────────────────────
-- 5. AFTER the pg_dump backup and after Ben maps rooms to families.
--    Family user ids: Authentication > Users.
-- ─────────────────────────────────────────────────────────────
-- See what is there:
--   select room_id, count(*), string_agg(name, ', ') from eq_players group by room_id order by 2 desc;
-- Assign each family's rooms:
--   update eq_players set owner_id = '<family-user-uuid>' where room_id in ('ROOM1', 'ROOM2');
-- Rooms nobody can place (after Ben has seen the list):
--   delete from eq_players where owner_id is null;
-- Then:
--   alter table eq_players alter column owner_id set not null;
--   alter table eq_players drop column age, drop column gender, drop column room_id;

-- ─────────────────────────────────────────────────────────────
-- 6. Checks
-- ─────────────────────────────────────────────────────────────
--   set role anon; select count(*) from eq_players; reset role;          -- permission denied
--   set role anon; select public.keepalive(); reset role;                -- 1
--   create table zz_probe(x int); set role anon; select * from zz_probe; reset role; drop table zz_probe;  -- permission denied
--   select count(*) from eq_players where owner_id is null;              -- 0 after step 5
