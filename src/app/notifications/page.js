"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KQAppShell from "@/components/KQAppShell";
import { Button } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [pendingAction, setPendingAction] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load notifications");
      setItems(data.notifications || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load notifications. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => {
    if (status !== "authenticated") return undefined;
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [status, load]);

  const markRead = async (id) => {
    setPendingAction(true);
    setError("");
    setActionNotice("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not mark this notification as read");
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      setActionNotice("Notification marked as read.");
      window.dispatchEvent(new Event("notifications-updated"));
      return true;
    } catch (actionError) {
      setError(actionError.message || "Could not update this notification. Try again.");
      return false;
    } finally {
      setPendingAction(false);
    }
  };

  const markAllRead = async () => {
    setPendingAction(true);
    setError("");
    setActionNotice("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not mark notifications as read");
      setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setActionNotice("All notifications marked as read.");
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (actionError) {
      setError(actionError.message || "Could not update notifications. Try again.");
    } finally {
      setPendingAction(false);
    }
  };

  return (
    <KQAppShell>
      <div className="app-page space-y-6">
        <section className="rounded-3xl bg-[#101b2b] p-7 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-24 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs uppercase tracking-[.2em] text-rose-300 font-bold">Your network, in the loop</p><h1 className="mt-2 text-3xl sm:text-4xl font-extrabold">Notifications</h1><p className="mt-2 text-slate-300">Connection and mentorship activity, all in one place.</p></div>
            {items.some((item) => !item.readAt) && <Button size="sm" className="w-full sm:w-auto" onClick={markAllRead} disabled={pendingAction}>{pendingAction ? "Updating…" : "Mark all read"}</Button>}
          </div>
        </section>
        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><Button size="sm" variant="secondary" onClick={load}>Try again</Button></div>}
        {actionNotice && <p role="status" aria-live="polite" className="text-sm text-emerald-800">{actionNotice}</p>}
        <section className="card p-3 sm:p-5">
          {loading ? <p className="p-8 text-center text-slate-500" role="status">Loading your updates…</p> : error ? null : items.length ? <div className="divide-y divide-slate-100">{items.map((item) => <article key={item.id} className={`flex gap-4 p-4 sm:p-5 rounded-2xl ${item.readAt ? "" : "bg-rose-50/60"}`}>
            <span className={`mt-1 grid place-items-center w-10 h-10 rounded-xl ${item.readAt ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-[#c8102e]"}`}><Icon name="bell" size={17} /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{item.title}</h2>{!item.readAt && <span className="w-2 h-2 rounded-full bg-[#c8102e]" aria-label="Unread" />}</div><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</p></div>
            <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">{!item.readAt && <button type="button" disabled={pendingAction} className="text-xs font-semibold text-slate-500 hover:text-[#c8102e] disabled:opacity-50" onClick={() => markRead(item.id)}>Mark read</button>}{item.href && <Link href={item.href} onClick={(event) => { if (item.readAt) return; event.preventDefault(); markRead(item.id).then((updated) => { if (updated) router.push(item.href); }); }} className="text-sm font-bold text-[#c8102e]">View</Link>}</div>
          </article>)}</div> : <div className="py-16 text-center"><div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-rose-50 text-[#c8102e]"><Icon name="bell" size={23} /></div><h2 className="mt-4 text-lg font-bold text-slate-900">You’re all caught up</h2><p className="mt-1 text-sm text-slate-500">New requests and responses will appear here.</p></div>}
        </section>
      </div>
    </KQAppShell>
  );
}
