-- ============================================================
-- Step 2.1 Fix: game_players RLS
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- The previous select policy had an infinite recursion bug because
-- querying game_players to check membership of game_players triggered
-- the policy itself.

drop policy if exists "Users can view players in their games" on public.game_players;

-- Replace it with a simpler policy allowing any authenticated user to view players.
-- (As per MVP requirements: "or just make them readable to all authenticated users for simplicity")
create policy "Users can view all players"
  on public.game_players
  for select
  to authenticated
  using (true);
