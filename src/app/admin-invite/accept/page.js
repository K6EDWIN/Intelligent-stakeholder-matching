"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { KQLogo } from "@/components/KQBrand";
import { readApiResponse } from "@/lib/read-api-response";

export default function AcceptAdminInvitationPage() {
  const tokenRef = useRef("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const inviteToken = new URLSearchParams(window.location.search).get("token") || "";
    tokenRef.current = inviteToken;
    if (!inviteToken) {
      Promise.resolve().then(() => {
        setError("This invitation link is incomplete. Ask an administrator to send a new invitation.");
        setLoading(false);
      });
      return;
    }

    fetch(`/api/admin/invitations/accept?token=${encodeURIComponent(inviteToken)}`)
      .then(async (response) => {
        const data = await readApiResponse(response, "This invitation is invalid or expired");
        setEmail(data.email);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current, password: form.get("password"), confirmPassword: form.get("confirmPassword") }),
      });
      await readApiResponse(response, "Could not activate the administrator account");
      setActivated(true);
    } catch (requestError) {
      setError(requestError.message || "Could not activate the administrator account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
        <div className="bg-[#071626] px-7 py-7 text-white sm:px-9">
          <KQLogo light />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Secure administrator setup</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Accept your invitation</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Create a password to activate your administrator access. You can then choose password or Google sign-in.</p>
        </div>

        <div className="space-y-5 p-7 sm:p-9">
          {loading ? (
            <p role="status" className="py-8 text-center text-sm text-slate-500">Checking your invitation…</p>
          ) : activated ? (
            <div className="space-y-4">
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
                <b className="block">Administrator access is active.</b>
                You can now use Google sign-in with <b>{email}</b>, or sign in with the password you just created.
              </div>
              <button type="button" onClick={() => signIn("google", { callbackUrl: "/admin" })} className="w-full rounded-xl bg-[#c8102e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a90e27]">Continue with Google</button>
              <Link href="/login" className="block text-center text-sm font-semibold text-[#0e2740] underline underline-offset-4">Go to sign in</Link>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">{error}</p>
              <Link href="/login" className="block text-center text-sm font-semibold text-[#0e2740] underline underline-offset-4">Return to sign in</Link>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Invited Google account <b className="break-all text-slate-900">{email}</b></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Create password</span>
                  <input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#c8102e] focus:ring-4 focus:ring-red-50" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">Confirm password</span>
                  <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#c8102e] focus:ring-4 focus:ring-red-50" />
                </label>
                {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
                <p className="text-xs leading-relaxed text-slate-500">Use at least 8 characters. This one-time invitation is valid for 24 hours.</p>
                <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#c8102e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a90e27] disabled:cursor-wait disabled:opacity-60">{saving ? "Activating account…" : "Set password & activate access"}</button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
