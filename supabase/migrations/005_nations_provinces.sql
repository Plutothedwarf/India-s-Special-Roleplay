-- ============================================================
-- Step 3: Map Import — nations and provinces
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- 1. Create the nations table
create table if not exists public.nations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade not null,
  azgaar_state_id int,
  name text not null,
  government_type text,
  color text,
  capital_burg_name text,
  is_claimed boolean default false not null,
  created_at timestamptz default now()
);

-- Enable RLS for nations
alter table public.nations enable row level security;

-- Policy: Users can view nations if they are a member of the game
create policy "Users can view nations in their games"
  on public.nations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.game_players
      where game_id = nations.game_id
      and user_id = auth.uid()
    )
  );


-- 2. Create the provinces table
create table if not exists public.provinces (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade not null,
  nation_id uuid references public.nations(id) on delete set null,
  azgaar_province_id int,
  name text not null,
  geometry jsonb,
  created_at timestamptz default now()
);

-- Enable RLS for provinces
alter table public.provinces enable row level security;

-- Policy: Users can view provinces if they are a member of the game
create policy "Users can view provinces in their games"
  on public.provinces
  for select
  to authenticated
  using (
    exists (
      select 1 from public.game_players
      where game_id = provinces.game_id
      and user_id = auth.uid()
    )
  );

-- 3. Update game_players table (add nation_id foreign key from Step 2)
alter table public.game_players
  add column if not exists nation_id uuid references public.nations(id) on delete set null;
