"use client";

import { useState } from "react";

const ENDPOINTS = {
  mentorship: "/api/mentorship-requests",
  connection: "/api/connection-requests",
};

// Send-a-request buttons reused on the Directory and Recommendations pages --
// both are places you'd find someone to reach out to.
export default function RequestActions({ userId }) {
  const [sentKinds, setSentKinds] = useState({
    mentorship: false,
    connection: false,
  });
  const [pendingKind, setPendingKind] = useState(null);
  const [error, setError] = useState("");

  const send = async (kind) => {
    setPendingKind(kind);
    setError("");

    const res = await fetch(ENDPOINTS[kind], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });
    const data = await res.json();

    setPendingKind(null);

    if (!res.ok) {
      setError(data.error || "Could not send request");
      return;
    }

    setSentKinds((s) => ({ ...s, [kind]: true }));
  };

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex gap-2">
        <button
          onClick={() => send("mentorship")}
          disabled={sentKinds.mentorship || pendingKind === "mentorship"}
          className="text-xs border rounded px-3 py-1 disabled:opacity-50 whitespace-nowrap"
        >
          {sentKinds.mentorship ? "Request sent" : "Request mentorship"}
        </button>
        <button
          onClick={() => send("connection")}
          disabled={sentKinds.connection || pendingKind === "connection"}
          className="text-xs border rounded px-3 py-1 disabled:opacity-50 whitespace-nowrap"
        >
          {sentKinds.connection ? "Request sent" : "Connect"}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
