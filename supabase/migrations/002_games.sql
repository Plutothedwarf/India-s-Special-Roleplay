-- ============================================================
-- Step 2 Migration: games + game_players tables
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- 1. Create the game status enum
create type public.game_status as enum ('setup', 'active', 'paused', 'ended');

-- 2. Create the game_role enum
create type public.game_role as enum ('player', 'god');

-- 3. Create the games table
create table if not exists public.games (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  created_by             uuid not null references public.profiles(id) on delete cascade,
  map_source_name        text,
  tick_interval_minutes  int not null default 60,
  game_date              text default '1-1',
  status                 public.game_status not null default 'setup',
  created_at             timestamptz default now()
);

-- 4. Create the game_players table
--    nation_id is omitted for now — it will be added in the step 3
--    migration once the nations table exists.
create table if not exists public.game_players (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      public.game_role not null default 'player',
  joined_at timestamptz default now(),

  -- A user can only join a game once
  unique(game_id, user_id)
);

-- ============================================================
-- Row-Level Security
-- ============================================================

-- 5. Enable RLS on both tables
alter table public.games enable row level security;
alter table public.game_players enable row level security;

-- ── games policies ──────────────────────────────────────────

-- Anyone authenticated can see all games (needed for the "browse rooms" list)
create policy "Authenticated users can view all games"
  on public.games
  for select
  to authenticated
  using (true);

-- Only authenticated users can create games
create policy "Authenticated users can create games"
  on public.games
  for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Only the creator can update their game (e.g. change status)
create policy "Game creator can update their game"
  on public.games
  for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ── game_players policies ───────────────────────────────────

-- A user can see game_players rows for games they are in
create policy "Users can view players in their games"
  on public.game_players
  for select
  to authenticated
  using (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = game_players.game_id
        and gp.user_id = auth.uid()
    )
  );

-- A user can insert themselves into a game (join)
create policy "Users can join games"
  on public.game_players
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- A user can remove themselves from a game (leave)
create policy "Users can leave games"
  on public.game_players
  for delete
  to authenticated
  using (auth.uid() = user_id);
