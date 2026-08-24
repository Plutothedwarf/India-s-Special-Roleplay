-- ============================================================
-- Step 4.1: Add label coordinates to nations
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

ALTER TABLE public.nations ADD COLUMN label_x float;
ALTER TABLE public.nations ADD COLUMN label_y float;
