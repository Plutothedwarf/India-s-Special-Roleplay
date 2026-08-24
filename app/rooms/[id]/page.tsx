import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeaveRoomButton from "./leave-room-button";

type Params = Promise<{ id: string }>;

export default async function RoomDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id: gameId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch the game
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (!game) {
    notFound();
  }

  // Fetch all players in this game with their profiles
  const { data: players } = await supabase
    .from("game_players")
    .select(
      `
      id,
      role,
      joined_at,
      user_id,
      profiles:user_id (
        display_name
      )
    `
    )
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  // Determine current user's membership
  const myMembership = players?.find((p) => p.user_id === user.id);
  const isGod = myMembership?.role === "god";

  if (!myMembership) {
    // User is not a member of this game
    redirect("/dashboard");
  }

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <a href="/dashboard" className="back-link">
          ← Back to Dashboard
        </a>
        <div className="room-detail-title-row">
          <h1 className="page-title">{game.name}</h1>
          <span className={`room-status room-status-${game.status}`}>
            {game.status}
          </span>
        </div>
      </header>

      {/* Game info card */}
      <section className="profile-card" style={{ marginBottom: "1.5rem" }}>
        <h2>Room Details</h2>

        <div className="profile-field">
          <span className="profile-field-label">Your Role</span>
          <span
            className={`room-role room-role-${myMembership.role}`}
            style={{ fontSize: "1rem" }}
          >
            {isGod ? "⚡ God" : "🎮 Player"}
          </span>
        </div>

        <div className="profile-field">
          <span className="profile-field-label">Status</span>
          <span className="profile-field-value">{game.status}</span>
        </div>

        <div className="profile-field">
          <span className="profile-field-label">Tick Interval</span>
          <span className="profile-field-value">
            {game.tick_interval_minutes} min
          </span>
        </div>

        <div className="profile-field">
          <span className="profile-field-label">Game Date</span>
          <span className="profile-field-value">{game.game_date ?? "—"}</span>
        </div>

        {game.map_source_name && (
          <div className="profile-field">
            <span className="profile-field-label">Map</span>
            <span className="profile-field-value">{game.map_source_name}</span>
          </div>
        )}

        <div className="profile-field">
          <span className="profile-field-label">Created</span>
          <span className="profile-field-value">
            {new Date(game.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </section>

      {/* Players list */}
      <section className="profile-card" style={{ marginBottom: "1.5rem" }}>
        <h2>
          Players ({players?.length ?? 0})
        </h2>

        {players && players.length > 0 ? (
          players.map((p) => {
            const profile = p.profiles as unknown as {
              display_name: string;
            } | null;
            return (
              <div key={p.id} className="profile-field">
                <span className="profile-field-value">
                  {profile?.display_name ?? "Unknown"}
                </span>
                <span className={`room-role room-role-${p.role}`}>
                  {p.role === "god" ? "⚡ God" : "🎮 Player"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="room-meta-label">No players yet.</p>
        )}
      </section>

      {/* Coming soon + leave */}
      <div className="coming-soon">
        🏗️ Map import, nation claiming, and the world clock are coming in
        future steps.
      </div>

      {!isGod && (
        <div style={{ marginTop: "1.5rem" }}>
          <LeaveRoomButton gameId={gameId} />
        </div>
      )}
    </div>
  );
}
