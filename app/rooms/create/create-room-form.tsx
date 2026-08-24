"use client";

import { useActionState } from "react";
import { createRoom, type RoomActionResult } from "@/app/actions/rooms";

const initialState: RoomActionResult = {};

export default function CreateRoomForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState
  );

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
          disabled={isPending}
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
          disabled={isPending}
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
        disabled={isPending}
      >
        {isPending ? "Creating…" : "✦ Create Room"}
      </button>
    </form>
  );
}
