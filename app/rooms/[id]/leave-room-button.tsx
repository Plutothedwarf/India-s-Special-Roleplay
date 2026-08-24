"use client";

import { useState } from "react";
import { leaveRoom } from "@/app/actions/rooms";

export default function LeaveRoomButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    if (!window.confirm("Are you sure you want to leave this room?")) return;

    setLoading(true);
    setError(null);

    const result = await leaveRoom(gameId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="btn-danger btn-full"
        onClick={handleLeave}
        disabled={loading}
      >
        {loading ? "Leaving…" : "🚪 Leave Room"}
      </button>
      {error && (
        <p className="error-text" role="alert" style={{ marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
