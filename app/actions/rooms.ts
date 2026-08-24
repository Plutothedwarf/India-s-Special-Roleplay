"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseAzgaarMap } from "./parse-map";

export type RoomActionResult = {
  error?: string;
  success?: boolean;
  gameId?: string;
};

/**
 * Create a new game room. The creator automatically becomes the God.
 */
export async function createRoom(
  _prev: RoomActionResult,
  formData: FormData
): Promise<RoomActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a room." };
  }

  const name = (formData.get("name") as string)?.trim();
  const tickInterval = parseInt(formData.get("tick_interval") as string, 10);
  const mapFile = formData.get("mapFile") as File;

  if (!name || name.length < 2) {
    return { error: "Room name must be at least 2 characters." };
  }
  if (!tickInterval || tickInterval < 1) {
    return { error: "Tick interval must be at least 1 minute." };
  }
  if (!mapFile || mapFile.size === 0) {
    return { error: "You must upload an Azgaar map file." };
  }

  let parsedMap;
  try {
    const fileText = await mapFile.text();
    parsedMap = parseAzgaarMap(fileText);
  } catch (err: any) {
    return { error: "Failed to parse the map file: " + err.message };
  }

  // 1. Create the game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      name,
      created_by: user.id,
      map_source_name: mapFile.name.replace(/\.map$/, ""),
      tick_interval_minutes: tickInterval,
      status: "setup",
    })
    .select("id")
    .single();

  if (gameError) {
    return { error: gameError.message };
  }

  // 2. Add the creator as God
  const { error: playerError } = await supabase.from("game_players").insert({
    game_id: game.id,
    user_id: user.id,
    role: "god",
  });

  if (playerError) {
    return { error: playerError.message };
  }

  // 3. Batch insert nations
  if (parsedMap.nations.length > 0) {
    const nationsToInsert = parsedMap.nations.map((n) => ({
      game_id: game.id,
      azgaar_state_id: n.azgaar_state_id,
      name: n.name,
      color: n.color,
      capital_burg_name: n.capital_burg_name,
    }));

    const { data: insertedNations, error: nationsError } = await supabase
      .from("nations")
      .insert(nationsToInsert)
      .select("id, azgaar_state_id");

    if (nationsError) {
      return { error: "Failed to insert nations: " + nationsError.message };
    }

    // 4. Batch insert provinces (mapped to the newly inserted nation IDs)
    if (parsedMap.provinces.length > 0 && insertedNations) {
      const azgaarStateIdToNationId = new Map<number, string>();
      insertedNations.forEach((n) => {
        azgaarStateIdToNationId.set(n.azgaar_state_id, n.id);
      });

      const provincesToInsert = parsedMap.provinces.map((p) => ({
        game_id: game.id,
        nation_id: azgaarStateIdToNationId.get(p.azgaar_state_id) || null,
        azgaar_province_id: p.azgaar_province_id,
        name: p.name,
      }));

      // Supabase has a limit on rows per insert, but usually it's ~1000-2000. 
      // If a map has many provinces, we might need chunks, but let's try direct insert first.
      const { error: provError } = await supabase.from("provinces").insert(provincesToInsert);
      
      if (provError) {
        return { error: "Failed to insert provinces: " + provError.message };
      }
    }
  }

  // Clear cached data so the new room appears immediately
  revalidatePath("/dashboard");
  revalidatePath("/rooms/browse");
  
  redirect(`/rooms/${game.id}`);
}

/**
 * Join an existing game room as a player.
 */
export async function joinRoom(gameId: string): Promise<RoomActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to join a room." };
  }

  // Check the game exists
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, status")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return { error: "Room not found." };
  }

  // Check user isn't already in this game
  const { data: existing } = await supabase
    .from("game_players")
    .select("id")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "You are already in this room." };
  }

  // Join as player
  const { error: joinError } = await supabase.from("game_players").insert({
    game_id: gameId,
    user_id: user.id,
    role: "player",
  });

  if (joinError) {
    return { error: joinError.message };
  }

  redirect(`/rooms/${gameId}`);
}

/**
 * Leave a game room.
 */
export async function leaveRoom(gameId: string): Promise<RoomActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("game_players")
    .delete()
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
