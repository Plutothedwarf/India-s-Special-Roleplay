import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: rooms } = await supabase.from('games').select('id, name, created_at, map_source_name').order('created_at', { ascending: false }).limit(5);
  
  const results = [];
  if (rooms) {
    for (const room of rooms) {
      const { count } = await supabase.from('nations').select('id', { count: 'exact', head: true }).eq('game_id', room.id);
      
      const { data: nations } = await supabase.from('nations').select('name').eq('game_id', room.id);
      
      results.push({
        ...room,
        nationsCount: count,
        nations: nations?.map(n => n.name) || []
      });
    }
  }
  
  return NextResponse.json(results);
}
