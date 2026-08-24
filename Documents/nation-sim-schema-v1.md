# Nation-Sim Game — MVP Data Model (v1)

Scope: rooms/games, auth, Azgaar map import, nation claiming, the world clock, God tools, and the public/private action log. No economy or combat fields yet — those get added in a later pass once this skeleton works.

Backend: Supabase (Postgres + Auth + Realtime + Row-Level Security).

---

## Core tables

### `profiles`
One row per logged-in user (mirrors `auth.users`, which Supabase's Google OAuth populates automatically).

- `id` (uuid, PK, = auth.users.id)
- `display_name` (text)
- `created_at` (timestamptz)

### `games`
A room. Each room has its own map, its own clock, its own set of players.

- `id` (uuid, PK)
- `name` (text)
- `created_by` (uuid, FK → profiles.id)
- `map_source_name` (text) — e.g. "Morvaland"
- `tick_interval_minutes` (int) — e.g. 60 = "1 real hour per in-game day"
- `game_date` (text or a structured `{year, day}`) — the current in-game date
- `status` (enum: `setup`, `active`, `paused`, `ended`)
- `created_at` (timestamptz)

### `game_players`
Who's in a room, and what they control. This is the join table that drives most permission logic.

- `id` (uuid, PK)
- `game_id` (FK → games.id)
- `user_id` (FK → profiles.id)
- `role` (enum: `player`, `god`)
- `nation_id` (FK → nations.id, nullable — null until they claim a nation; always null for `god`)
- `joined_at` (timestamptz)

### `nations`
Parsed out of the .map file at game creation. One row per nation, per game (so the same map can be reused across multiple rooms without collision).

- `id` (uuid, PK)
- `game_id` (FK → games.id)
- `azgaar_state_id` (int) — the ID Azgaar used internally, kept so we can re-cross-reference the source map
- `name` (text)
- `government_type` (enum: `democracy`, `theocracy`, `dictatorship`, ... — extendable)
- `color` (text) — from the map, for rendering
- `capital_burg_name` (text)
- `is_claimed` (bool)

### `provinces`
Sub-regions of a nation (Azgaar has provinces/cells within states).

- `id` (uuid, PK)
- `game_id` (FK → games.id)
- `nation_id` (FK → nations.id, nullable — unclaimed/neutral land has no nation)
- `azgaar_province_id` (int)
- `name` (text)
- `geometry` (jsonb, currently unpopulated — see note below)

> **Known gap, discovered during step 4:** Azgaar's `.map` file does not store pre-computed SVG shapes for individual provinces — those are calculated dynamically in Azgaar via a D3 Voronoi graph, which is nontrivial to replicate. It *does* store pre-computed shapes for nations/states. As a result, step 4 renders the map at the **nation level only** — province name/ownership data is still imported and stored (from step 3), just not individually drawn or clickable on the map yet.
>
> **This is a real, not-yet-closed gap for later gameplay.** Anything that needs to target or affect a specific sub-region rather than a whole nation — conquering individual territory rather than a whole nation at once, provinces rebelling, espionage or unrest targeting a specific region — needs real province-level geometry to work properly. This should be tackled as its own dedicated task (likely something like "step 4.5: province geometry") specifically when we design the war/territory/espionage systems — not assumed to already work because the `provinces` table exists.

### `game_clock_events`
An append-only log the clock writes to as it advances. Doubles as the "world heartbeat" feed every client can subscribe to.

- `id` (uuid, PK)
- `game_id` (FK → games.id)
- `game_date` (text)
- `real_timestamp` (timestamptz)
- `note` (text, nullable) — e.g. a God-triggered event description

### `action_log`
Every player action creates a row here. This is where the "visible to all, but details private" requirement actually gets implemented.

- `id` (uuid, PK)
- `game_id` (FK → games.id)
- `actor_nation_id` (FK → nations.id)
- `target_nation_id` (FK → nations.id, nullable)
- `action_type` (text) — e.g. `diplomacy_proposal`, `troop_movement`, `espionage_attempt`
- `public_summary` (text) — always visible to everyone, e.g. "Astoria took action regarding Velmoor"
- `private_detail` (jsonb) — only visible to the actor, the target (if applicable), and the God
- `created_at` (timestamptz)

### `god_actions`
A dedicated audit log for moderator interventions, kept separate from `action_log` so it's always clearly distinguishable from player actions.

- `id` (uuid, PK)
- `game_id` (FK → games.id)
- `god_user_id` (FK → profiles.id)
- `action_type` (text) — e.g. `edit_field`, `spawn_event`, `pause_clock`, `force_message`
- `details` (jsonb)
- `created_at` (timestamptz)

---

## How privacy actually gets enforced

This is done with Postgres Row-Level Security (RLS) policies on `action_log`, not by hiding fields in the frontend (hiding in the frontend is not real security — a player could just read the network response). Roughly:

- **SELECT on `public_summary`**: allowed for any authenticated player in that `game_id`.
- **SELECT on `private_detail`**: only allowed if `auth.uid()`'s `game_players` row has `nation_id` matching `actor_nation_id` or `target_nation_id`, OR `role = 'god'`.

In practice this usually means: expose `public_summary` through a plain view everyone can query, and gate `private_detail` behind a policy (or a separate table) so Postgres itself refuses the read rather than the app trying to remember to filter it.

---

## MVP build order (for Antigravity, task by task)

1. Supabase project + Google OAuth + `profiles` table (auto-populate on sign-up)
2. `games` + `game_players` tables, create-room and join-room flows
3. Map import script: parse an uploaded `.map` file → populate `nations` and `provinces` for that `game_id`
4. Map rendering: SVG/Canvas view of provinces, colored by nation
5. Nation claiming flow (player picks an unclaimed nation)
6. World clock: scheduled function that advances `game_date` on `tick_interval_minutes` and writes to `game_clock_events`
7. God dashboard: view all nations' full data, edit any field, write to `god_actions`, pause/resume the clock
8. `action_log` with the public/private split and RLS policies, plus a live feed UI

Steps 1–5 give you login → room → map on screen. Steps 6–8 give you the living world + God control loop you said matters most.
