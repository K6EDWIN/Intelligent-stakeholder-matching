"use client";

import { useState } from "react";
import Link from "next/link";
import { KQLogo, Button } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import { ViewModeToggle } from "@/components/ViewMode";
import { readApiResponse } from "@/lib/read-api-response";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: new URLSearchParams(window.location.search).get("token") || "", password }),
      });
      await readApiResponse(response, "Could not reset your password");
      setComplete(true);
      setPassword("");
      setConfirmation("");
    } catch (resetError) {
      setError(resetError.message || "We could not reset your password. Request a new link and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page min-h-screen bg-[#071626] px-4 py-6 text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between"><KQLogo light /><ViewModeToggle compact /></header>
      <section className="mx-auto mt-12 max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl sm:mt-20 sm:p-9">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#c8102e]"><Icon name="shield" size={22} /></div>
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        {complete ? (
          <div className="mt-5 space-y-4"><p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Your password has been changed. Any existing sign-in sessions have been invalidated.</p><Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#c8102e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a80d26]">Continue to sign in</Link></div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">Choose a password between 8 and 128 characters. This link can only be used once.</p>
            <div><label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-slate-700">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#c8102e]" /></div>
            <div><label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#c8102e]" /></div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Changing password…" : "Save new password"}</Button>
          </form>
        )}
      </section>
    </main>
  );
}
