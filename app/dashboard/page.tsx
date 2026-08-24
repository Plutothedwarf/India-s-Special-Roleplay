import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

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

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-greeting">
          Welcome, <span>{profile?.display_name ?? user.email}</span>
        </h1>
        <SignOutButton />
      </header>

      <section className="profile-card">
        <h2>Your Profile</h2>

        <div className="profile-field">
          <span className="profile-field-label">Display Name</span>
          <span className="profile-field-value">
            {profile?.display_name ?? "—"}
          </span>
        </div>

        <div className="profile-field">
          <span className="profile-field-label">Email</span>
          <span className="profile-field-value">{user.email ?? "—"}</span>
        </div>

        <div className="profile-field">
          <span className="profile-field-label">User ID</span>
          <span className="profile-field-value" style={{ fontSize: "0.75rem" }}>
            {user.id}
          </span>
        </div>

        <div className="profile-field">
          <span className="profile-field-label">Member Since</span>
          <span className="profile-field-value">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </span>
        </div>
      </section>

      <div className="coming-soon">
        🏗️ Room creation, map import, and nation claiming coming in future
        steps.
      </div>
    </div>
  );
}
