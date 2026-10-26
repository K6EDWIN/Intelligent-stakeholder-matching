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

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setItems(data.notifications || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => {
    if (status !== "authenticated") return undefined;
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [status, load]);

  const markRead = async (id) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    window.dispatchEvent(new Event("notifications-updated"));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    window.dispatchEvent(new Event("notifications-updated"));
  };

  return (
    <KQAppShell>
      <div className="app-page space-y-6">
        <section className="rounded-3xl bg-[#101b2b] p-7 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-24 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs uppercase tracking-[.2em] text-rose-300 font-bold">Your network, in the loop</p><h1 className="mt-2 text-3xl sm:text-4xl font-extrabold">Notifications</h1><p className="mt-2 text-slate-300">Connection and mentorship activity, all in one place.</p></div>
            {items.some((item) => !item.readAt) && <Button size="sm" className="w-full sm:w-auto" onClick={markAllRead}>Mark all read</Button>}
          </div>
        </section>
        <section className="card p-3 sm:p-5">
          {loading ? <p className="p-8 text-center text-slate-500">Loading your updates…</p> : items.length ? <div className="divide-y divide-slate-100">{items.map((item) => <article key={item.id} className={`flex gap-4 p-4 sm:p-5 rounded-2xl ${item.readAt ? "" : "bg-rose-50/60"}`}>
            <span className={`mt-1 grid place-items-center w-10 h-10 rounded-xl ${item.readAt ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-[#c8102e]"}`}><Icon name="bell" size={17} /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{item.title}</h2>{!item.readAt && <span className="w-2 h-2 rounded-full bg-[#c8102e]" aria-label="Unread" />}</div><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</p></div>
            <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">{!item.readAt && <button className="text-xs font-semibold text-slate-500 hover:text-[#c8102e]" onClick={() => markRead(item.id)}>Mark read</button>}{item.href && <Link href={item.href} onClick={() => !item.readAt && markRead(item.id)} className="text-sm font-bold text-[#c8102e]">View</Link>}</div>
          </article>)}</div> : <div className="py-16 text-center"><div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-rose-50 text-[#c8102e]"><Icon name="bell" size={23} /></div><h2 className="mt-4 text-lg font-bold text-slate-900">You’re all caught up</h2><p className="mt-1 text-sm text-slate-500">New requests and responses will appear here.</p></div>}
        </section>
      </div>
    </KQAppShell>
  );
}
