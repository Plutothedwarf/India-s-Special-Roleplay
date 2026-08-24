-- ============================================================
-- Step 3 (Fix): Map Import — add INSERT policies
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- Policy: Users can insert nations if they are a 'god' of the game
create policy "Gods can insert nations"
  on public.nations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.game_players
      where game_id = nations.game_id
      and user_id = auth.uid()
      and role = 'god'
    )
  );

-- Policy: Users can insert provinces if they are a 'god' of the game
create policy "Gods can insert provinces"
  on public.provinces
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.game_players
      where game_id = provinces.game_id
      and user_id = auth.uid()
      and role = 'god'
    )
  );
