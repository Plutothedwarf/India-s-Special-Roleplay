"use client";

import { useState } from "react";
import { joinRoom } from "@/app/actions/rooms";

export default function JoinRoomButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);

    const result = await joinRoom(gameId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If no error, the server action redirects to /rooms/[id]
  }

  return (
    <div>
      <button
        className="btn-primary btn-full"
        onClick={handleJoin}
        disabled={loading}
      >
        {loading ? "Joining…" : "🚀 Join Room"}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
