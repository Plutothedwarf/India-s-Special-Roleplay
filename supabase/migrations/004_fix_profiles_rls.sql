-- ============================================================
-- Step 2.2 Fix: profiles RLS
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- The previous policy only allowed users to see their own profile.
-- This caused other players in a game room to show up as "Unknown" 
-- because their profile data couldn't be fetched by the current user.

drop policy if exists "Users can view their own profile" on public.profiles;

-- Allow any authenticated user to see any profile.
-- (This ensures display names are visible to everyone in the room roster).
-- The UPDATE policy remains unchanged, so users can still only edit their own profile.
create policy "Authenticated users can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (true);
