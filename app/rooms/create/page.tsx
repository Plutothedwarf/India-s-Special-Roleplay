import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateRoomForm from "./create-room-form";

export default async function CreateRoomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <a href="/dashboard" className="back-link">
          ← Back to Dashboard
        </a>
        <h1 className="page-title">Create a New Room</h1>
        <p className="page-subtitle">
          Set up a game room. You&apos;ll become the <strong>God</strong> (moderator) of
          this room automatically.
        </p>
      </header>

      <CreateRoomForm />
    </div>
  );
}
