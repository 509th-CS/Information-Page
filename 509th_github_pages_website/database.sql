-- Run once in a NEW Supabase project using the SQL Editor.
-- No content or membership is publicly readable.
begin;
create table public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','member'))
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null check (char_length(trim(body)) between 1 and 20000),
  category text not null check (category in ('General','Announcements','Career & Training','Benefits & Support','Community','Resources')),
  pinned boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.memberships enable row level security;
alter table public.posts enable row level security;
revoke all on public.memberships from anon, authenticated;
revoke all on public.posts from anon, authenticated;
grant select on public.memberships to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
create policy own_membership on public.memberships for select to authenticated
  using (user_id = (select auth.uid()));
-- No browser insert/update/delete grants or policies on memberships.
-- Memberships can be managed ONLY through a trusted dashboard/server.
create policy members_read on public.posts for select to authenticated
  using (exists (select 1 from public.memberships m where m.user_id=(select auth.uid())));
create policy admins_insert on public.posts for insert to authenticated
  with check (exists (select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.role='admin'));
create policy admins_update on public.posts for update to authenticated
  using (exists (select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.role='admin'))
  with check (exists (select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.role='admin'));
create policy admins_delete on public.posts for delete to authenticated
  using (exists (select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.role='admin'));
create function public.stamp_post_update() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger post_update before update on public.posts for each row execute function public.stamp_post_update();
commit;
