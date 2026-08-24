"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  if (!name || name.length < 2) {
    return { error: "Room name must be at least 2 characters." };
  }
  if (!tickInterval || tickInterval < 1) {
    return { error: "Tick interval must be at least 1 minute." };
  }

  // 1. Create the game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      name,
      created_by: user.id,
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

  return { success: true, gameId: game.id };
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
