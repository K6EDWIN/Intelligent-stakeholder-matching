"use client";

import { useState } from "react";
import Link from "next/link";
import { KQLogo, Button } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import { ViewModeToggle } from "@/components/ViewMode";
import { readApiResponse } from "@/lib/read-api-response";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await readApiResponse(response, "Could not request a password reset");
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || "We could not process that request. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page min-h-screen bg-[#071626] px-4 py-6 text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between"><KQLogo light /><ViewModeToggle compact /></header>
      <section className="mx-auto mt-12 max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl sm:mt-20 sm:p-9">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#c8102e]"><Icon name="shield" size={22} /></div>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Enter the email address on your PrideConnect account. We’ll send a one-time link if an active account matches.</p>
        {submitted ? (
          <div role="status" className="mt-6 space-y-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">If an active account uses that email, a reset link will arrive shortly. Check your inbox and spam folder.</p>
            <p className="text-xs text-slate-500">For your privacy, this message is the same whether or not an account exists.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
              <input id="reset-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#c8102e]" placeholder="you@example.com" />
            </div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending request…" : "Send reset link"}</Button>
          </form>
        )}
        <div className="mt-6 border-t border-slate-200 pt-4"><Link href="/login" className="text-sm font-semibold text-[#c8102e] hover:underline">Back to sign in</Link></div>
      </section>
    </main>
  );
}
