"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRoom, type RoomActionResult } from "@/app/actions/rooms";

const initialState: RoomActionResult = {};

export default function CreateRoomForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.gameId) {
      router.push(`/rooms/${state.gameId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="room-form">
      <div className="form-group">
        <label htmlFor="room-name" className="form-label">
          Room Name
        </label>
        <input
          id="room-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={64}
          placeholder="e.g. The Grand Campaign"
          className="form-input"
          disabled={isPending || state.success}
        />
      </div>

      <div className="form-group">
        <label htmlFor="tick-interval" className="form-label">
          Tick Interval (minutes)
        </label>
        <p className="form-hint">
          How many real-world minutes equal one in-game day. For example, 60 =
          one real hour per game day.
        </p>
        <input
          id="tick-interval"
          name="tick_interval"
          type="number"
          required
          min={1}
          max={1440}
          defaultValue={60}
          className="form-input"
          disabled={isPending || state.success}
        />
      </div>

      {state.error && (
        <div className="error-banner" role="alert">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary btn-full"
        id="btn-submit-create-room"
        disabled={isPending || state.success}
      >
        {isPending || state.success ? "Creating…" : "✦ Create Room"}
      </button>
    </form>
  );
}
