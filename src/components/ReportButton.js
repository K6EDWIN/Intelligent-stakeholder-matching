"use client";

import { useState } from "react";
import { readApiResponse } from "@/lib/read-api-response";

const REASONS = [
  ["HARASSMENT", "Harassment"],
  ["INAPPROPRIATE_CONTENT", "Inappropriate content"],
  ["SPAM", "Spam"],
  ["MISINFORMATION", "Misleading information"],
  ["OTHER", "Other"],
];

export default function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("INAPPROPRIATE_CONTENT");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, description }),
      });
      await readApiResponse(response, "Could not submit report");
      setMessage("Report sent to the administrators.");
      setDescription("");
      setOpen(false);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      {message ? (
        <p role="status" className="text-xs text-emerald-700">{message}</p>
      ) : (
        <button
          type="button"
          onClick={() => { setOpen((value) => !value); setError(""); }}
          className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-[#c8102e]"
        >
          {open ? "Cancel report" : "Report"}
        </button>
      )}
      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-semibold text-slate-700">
            Reason
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
            >
              {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Details (optional)
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-normal"
            />
          </label>
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-lg bg-[#0e2740] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
            {busy ? "Sending…" : "Submit report"}
          </button>
          <p className="text-[10px] leading-relaxed text-slate-500">Reports are visible to administrators for review. Avoid including unnecessary personal information.</p>
        </form>
      )}
    </div>
  );
}
