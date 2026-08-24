import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinRoomButton from "./join-room-button";

export default async function BrowseRoomsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch all games
  const { data: games } = await supabase
    .from("games")
    .select("id, name, status, tick_interval_minutes, created_at, created_by")
    .order("created_at", { ascending: false });

  // Fetch the games the current user is already in
  const { data: myMemberships } = await supabase
    .from("game_players")
    .select("game_id")
    .eq("user_id", user.id);

  const myGameIds = new Set(myMemberships?.map((m) => m.game_id) ?? []);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <a href="/dashboard" className="back-link">
          ← Back to Dashboard
        </a>
        <h1 className="page-title">Browse Rooms</h1>
        <p className="page-subtitle">
          Find a room to join as a player.
        </p>
      </header>

      {!games || games.length === 0 ? (
        <div className="empty-state">
          <p>No rooms exist yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {games.map((game) => {
            const isMember = myGameIds.has(game.id);
            const isCreator = game.created_by === user.id;

            return (
              <div key={game.id} className="room-card room-card-browse">
                <div className="room-card-header">
                  <h3 className="room-card-name">{game.name}</h3>
                  <span className={`room-status room-status-${game.status}`}>
                    {game.status}
                  </span>
                </div>

                <div className="room-card-meta">
                  <div className="room-meta-item">
                    <span className="room-meta-label">Tick interval</span>
                    <span className="room-meta-value">
                      {game.tick_interval_minutes}m
                    </span>
                  </div>
                  <div className="room-meta-item">
                    <span className="room-meta-label">Created</span>
                    <span className="room-meta-value">
                      {new Date(game.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="room-card-actions">
                  {isMember ? (
                    <a
                      href={`/rooms/${game.id}`}
                      className="btn-secondary btn-full"
                    >
                      {isCreator ? "⚡ Open (God)" : "🎮 Open (Player)"}
                    </a>
                  ) : (
                    <JoinRoomButton gameId={game.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
