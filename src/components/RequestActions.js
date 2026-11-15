"use client";

import { useState } from "react";
import { Icon } from "@/components/KQIcons";
import { readApiResponse } from "@/lib/read-api-response";

const ENDPOINTS = {
  mentorship: "/api/mentorship-requests",
  connection: "/api/connection-requests",
};

/**
 * Send-a-request action buttons for connecting or requesting mentorship.
 * Used across Directory and Recommendations pages.
 * Supports receiverId, userId, or id props interchangeably.
 */
export default function RequestActions({
  userId,
  receiverId,
  id,
  mentorshipRole,
}) {
  const targetId = receiverId || userId || id;

  const [sentKinds, setSentKinds] = useState({
    mentorship: false,
    connection: false,
  });
  const [pendingKind, setPendingKind] = useState(null);
  const [error, setError] = useState("");

  const send = async (kind) => {
    if (!targetId) {
      setError("Stakeholder ID missing. Please refresh and try again.");
      return;
    }

    setPendingKind(kind);
    setError("");

    try {
      const res = await fetch(ENDPOINTS[kind], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: targetId,
          userId: targetId,
        }),
      });

      await readApiResponse(res, "Could not send request");
      setPendingKind(null);

      setSentKinds((s) => ({ ...s, [kind]: true }));
    } catch (err) {
      setPendingKind(null);
      setError(err.message || "Could not send request. Please try again.");
    }
  };

  const mentorshipButtonLabel =
    mentorshipRole === "MENTEE" ? "Offer Mentorship" : "Request Mentorship";

  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0 w-full sm:w-auto">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Mentorship Request Button */}
        <button
          type="button"
          onClick={() => send("mentorship")}
          disabled={sentKinds.mentorship || pendingKind === "mentorship"}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer flex-1 sm:flex-initial ${
            sentKinds.mentorship
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
              : "bg-[#c8102e] text-white hover:bg-[#a60d26] disabled:opacity-60 shadow-xs"
          }`}
        >
          {sentKinds.mentorship ? (
            <>
              <Icon name="check" size={13} />
              <span>Mentorship Requested</span>
            </>
          ) : pendingKind === "mentorship" ? (
            <span>Sending...</span>
          ) : (
            <>
              <Icon name="requests" size={13} />
              <span>{mentorshipButtonLabel}</span>
            </>
          )}
        </button>

        {/* Connect Button */}
        <button
          type="button"
          onClick={() => send("connection")}
          disabled={sentKinds.connection || pendingKind === "connection"}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition cursor-pointer flex-1 sm:flex-initial border ${
            sentKinds.connection
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 shadow-xs"
          }`}
        >
          {sentKinds.connection ? (
            <>
              <Icon name="check" size={13} />
              <span>Connected</span>
            </>
          ) : pendingKind === "connection" ? (
            <span>Connecting...</span>
          ) : (
            <>
              <Icon name="sparkles" size={13} />
              <span>Connect</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-1.5 px-2 bg-red-50 border border-red-200 text-[#c8102e] text-[11px] rounded-md flex items-center gap-1.5">
          <Icon name="close" size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
