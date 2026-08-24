-- ============================================================
-- Step 4: Map Render — add geometry to nations
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

ALTER TABLE public.nations ADD COLUMN geometry text;
