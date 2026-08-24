import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeaveRoomButton from "./leave-room-button";
import MapViewer from "@/components/map-viewer";

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

  // 2. Query the nations
  const { data: nations, error: nationsError } = await supabase
    .from("nations")
    .select("id, azgaar_state_id, name, color, is_claimed, capital_burg_name, geometry, government_type")
    .eq("game_id", gameId)
    .order("azgaar_state_id");

  if (nationsError) {
    console.error("Nations fetch error:", nationsError);
  }

  // Find current user's role to conditionally show God-only tools
  const me = players?.find((p) => p.user_id === user.id);
  const isGod = me?.role === "god";

  if (!me) {
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
            className={`room-role room-role-${me.role}`}
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

      {/* Map Viewer */}
      {nations && nations.length > 0 && (
        <section className="profile-card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>World Map</h2>
          <MapViewer nations={nations} />
        </section>
      )}

      {/* Nations list */}
      <section className="profile-card" style={{ marginBottom: "1.5rem" }}>
        <h2>Nations ({nations?.length ?? 0})</h2>
        {(!nations || nations.length === 0) ? (
          <p className="room-meta-label">No nations imported for this map.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {nations.map((nation) => (
              <li key={nation.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div 
                    style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: nation.color || '#ccc', border: "1px solid #0f172a" }}
                    title="Nation color"
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: "#f1f5f9" }}>{nation.name}</div>
                    {nation.capital_burg_name && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Capital: {nation.capital_burg_name}</div>
                    )}
                  </div>
                </div>
                <div>
                  {nation.is_claimed ? (
                    <span style={{ padding: "0.25rem 0.5rem", background: "rgba(127, 29, 29, 0.5)", color: "#fca5a5", fontSize: "0.75rem", borderRadius: "9999px", border: "1px solid rgba(153, 27, 27, 0.5)" }}>Claimed</span>
                  ) : (
                    <span style={{ padding: "0.25rem 0.5rem", background: "rgba(6, 78, 59, 0.5)", color: "#6ee7b7", fontSize: "0.75rem", borderRadius: "9999px", border: "1px solid rgba(6, 95, 70, 0.5)" }}>Available</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
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
        🏗️ Nation claiming and the world clock are coming in future steps.
      </div>

      {!isGod && (
        <div style={{ marginTop: "1.5rem" }}>
          <LeaveRoomButton gameId={gameId} />
        </div>
      )}
    </div>
  );
}
