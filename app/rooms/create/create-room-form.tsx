"use client";

import { useActionState, useState, useRef } from "react";
import { createRoom, type RoomActionResult } from "@/app/actions/rooms";

const initialState: RoomActionResult = {};

export default function CreateRoomForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      <div className="form-group">
        <label htmlFor="mapFile" className="form-label">
          Azgaar Map File (.map)
        </label>
        <p className="form-hint">
          Upload your .map file exported from Azgaar's Fantasy Map Generator.
        </p>
        
        <input
          type="file"
          name="mapFile"
          id="mapFile"
          accept=".map"
          required
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileName(file ? file.name : null);
          }}
          className="hidden"
          disabled={isPending}
          style={{ display: "none" }}
        />
        
        <div 
          className="form-input flex items-center justify-between cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1 
          }}
        >
          <span style={{ color: fileName ? "inherit" : "rgba(255, 255, 255, 0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileName || "No file chosen..."}
          </span>
          <span 
            className="btn-secondary" 
            style={{ 
              padding: "0.25rem 0.75rem", 
              fontSize: "0.875rem", 
              borderRadius: "4px", 
              pointerEvents: "none",
              margin: 0
            }}
          >
            Browse
          </span>
        </div>
      </div>

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
