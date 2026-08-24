-- ============================================================
-- Step 1 Migration: profiles table + auto-populate trigger
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- 1. Create the profiles table
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz default now()
);

-- 2. Enable Row-Level Security
alter table public.profiles enable row level security;

-- 3. RLS policies
--    a) Users can read their own profile
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

--    b) Users can update their own profile (e.g. change display_name)
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Trigger function: auto-create a profiles row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer          -- runs with table-owner privileges
set search_path = ''      -- avoid search_path injection
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',   -- Google provides this
      new.raw_user_meta_data ->> 'name',         -- fallback
      new.email                                   -- last resort
    )
  );
  return new;
end;
$$;

-- 5. Wire the trigger to auth.users inserts
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
