import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch profile from our profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch rooms the user is part of, with game details
  const { data: memberships } = await supabase
    .from("game_players")
    .select(
      `
      id,
      role,
      joined_at,
      games:game_id (
        id,
        name,
        status,
        tick_interval_minutes,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-greeting">
          Welcome, <span>{profile?.display_name ?? user.email}</span>
        </h1>
        <SignOutButton />
      </header>

      {/* Room actions */}
      <div className="room-actions">
        <Link href="/rooms/create" className="btn-primary" id="btn-create-room">
          ✦ Create Room
        </Link>
        <Link href="/rooms/browse" className="btn-secondary" id="btn-browse-rooms">
          🔍 Browse Rooms
        </Link>
      </div>

      {/* My Rooms list */}
      <section className="rooms-section">
        <h2 className="section-title">Your Rooms</h2>

        {!memberships || memberships.length === 0 ? (
          <div className="empty-state">
            <p>You haven&apos;t joined any rooms yet.</p>
            <p>Create a new room or browse existing ones to get started.</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {memberships.map((membership) => {
              const game = membership.games as unknown as {
                id: string;
                name: string;
                status: string;
                tick_interval_minutes: number;
                created_at: string;
              };
              if (!game) return null;

              return (
                <Link
                  key={membership.id}
                  href={`/rooms/${game.id}`}
                  className="room-card"
                >
                  <div className="room-card-header">
                    <h3 className="room-card-name">{game.name}</h3>
                    <span className={`room-status room-status-${game.status}`}>
                      {game.status}
                    </span>
                  </div>

                  <div className="room-card-meta">
                    <div className="room-meta-item">
                      <span className="room-meta-label">Your role</span>
                      <span
                        className={`room-role room-role-${membership.role}`}
                      >
                        {membership.role === "god" ? "⚡ God" : "🎮 Player"}
                      </span>
                    </div>
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
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
