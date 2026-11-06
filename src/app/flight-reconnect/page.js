"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KQAppShell from "@/components/KQAppShell";
import { Button, Avatar } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

const ROLE_LABELS = {
  ALUMNI: "Pride Centre Alumni",
  STAFF: "Active KQ Staff",
  FORMER_STAFF: "Former KQ Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "Administrator",
};

const POPULAR_ROUTES = [
  { code: "KQ 102", from: "NBO", to: "LHR", label: "Nairobi ➔ London Heathrow" },
  { code: "KQ 116", from: "NBO", to: "AMS", label: "Nairobi ➔ Amsterdam Schiphol" },
  { code: "KQ 504", from: "NBO", to: "ACC", label: "Nairobi ➔ Accra Kotoka" },
  { code: "KQ 600", from: "NBO", to: "MBA", label: "Nairobi ➔ Mombasa Moi" },
  { code: "KQ 760", from: "NBO", to: "JNB", label: "Nairobi ➔ Johannesburg" },
  { code: "KQ 310", from: "NBO", to: "DXB", label: "Nairobi ➔ Dubai Int'l" },
];

function getYesterdayInNairobi() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const today = Object.fromEntries(parts.filter((part) => part.type !== "literal").map(({ type, value }) => [type, value]));
  const yesterday = new Date(`${today.year}-${today.month}-${today.day}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

export default function FlightReconnectPage() {
  const { status } = useSession();
  const router = useRouter();

  const [myFlights, setMyFlights] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [flightNumber, setFlightNumber] = useState("KQ 102");
  const [origin, setOrigin] = useState("NBO");
  const [destination, setDestination] = useState("LHR");
  const [travelDate, setTravelDate] = useState("");
  const [maxTravelDate] = useState(getYesterdayInNairobi);
  const [consentToShare, setConsentToShare] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState("");
  const [updatingFlightId, setUpdatingFlightId] = useState(null);
  const [deletingFlightId, setDeletingFlightId] = useState(null);

  // Handshake Modal
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [handshakeMessage, setHandshakeMessage] = useState(
    "Hello! I noticed we travelled on the same Kenya Airways flight. Would you be open to connecting and exchanging aviation insights?"
  );
  const [sendingHandshake, setSendingHandshake] = useState(false);
  const [handshakeSuccess, setHandshakeSuccess] = useState("");
  const [handshakeError, setHandshakeError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const refreshData = async () => {
    try {
      const res = await fetch("/api/flight-reconnect");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load flight reconnect data");
        return;
      }
      setMyFlights(data.myFlights || []);
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    let isCurrent = true;

    fetch("/api/flight-reconnect")
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        if (data.error) {
          setError(data.error);
        } else {
          setMyFlights(data.myFlights || []);
          setMatches(data.matches || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [status]);

  const handleApplyPreset = (r) => {
    setFlightNumber(r.code.toUpperCase());
    setOrigin(r.from);
    setDestination(r.to);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostSuccess("");
    setError("");

    try {
      const res = await fetch("/api/flight-reconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: flightNumber.trim().toUpperCase(),
          origin: origin.trim().toUpperCase(),
          destination: destination.trim().toUpperCase(),
          travelDate,
          consentToShare,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to log completed flight");
      } else {
        setPostSuccess(consentToShare
          ? "Completed flight saved. It will appear to other members only when they also opt in to exact-flight matching."
          : "Completed flight saved privately. You can enable peer matching from your trip list at any time.");
        setTravelDate("");
        setConsentToShare(false);
        await refreshData();
      }
    } catch (err) {
      setError("Could not save this flight. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  };

  const updateFlightConsent = async (flight) => {
    setUpdatingFlightId(flight.id);
    setError("");
    try {
      const res = await fetch(`/api/flight-reconnect/${flight.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentToShare: !flight.consentToShare }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update sharing consent");
      await refreshData();
    } catch (err) {
      setError(err.message || "Could not update sharing consent");
    } finally {
      setUpdatingFlightId(null);
    }
  };

  const deleteFlight = async (flight) => {
    if (!window.confirm("Remove this trip? It will stop appearing in peer matching.")) return;
    setDeletingFlightId(flight.id);
    setError("");
    try {
      const res = await fetch(`/api/flight-reconnect/${flight.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove this trip");
      await refreshData();
    } catch (err) {
      setError(err.message || "Could not remove this trip");
    } finally {
      setDeletingFlightId(null);
    }
  };

  const handleSendHandshake = async () => {
    if (!selectedPeer) return;
    setSendingHandshake(true);
    setHandshakeSuccess("");
    setHandshakeError("");

    try {
      const res = await fetch("/api/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedPeer.userId,
          message: handshakeMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setHandshakeError(data.error || "Failed to send connection request");
      } else {
        setHandshakeSuccess("Request sent. You’ll see its status here, and the recipient will be notified.");
        await refreshData();
        setTimeout(() => {
          setSelectedPeer(null);
          setHandshakeSuccess("");
        }, 1600);
      }
    } catch (err) {
      setHandshakeError("Could not send the request. Check your connection and try again.");
    } finally {
      setSendingHandshake(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 text-[#0e2740] flex items-center justify-center">
            <Icon name="flight" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Loading Flight Reconnect Module...
          </h2>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="app-page space-y-6">
        {/* Banner */}
        <section className="rounded-xl overflow-hidden bg-[#0e2740] text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/10 text-[#c59b27] text-xs font-bold uppercase tracking-wider">
              <Icon name="flight" size={13} />
              COMPLETED-FLIGHT RECONNECTION
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Reconnect With People From Your Flight
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Find verified PrideConnect members who opted in to sharing the same completed Kenya Airways flight. Your trip stays private unless you choose to share it.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-center min-w-[120px]">
              <b className="block text-2xl font-bold text-[#c59b27]">
                {myFlights.length}
              </b>
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                Logged Routes
              </span>
            </div>
            <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-center min-w-[120px]">
              <b className="block text-2xl font-bold text-emerald-400">
                {matches.length}
              </b>
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                Peer Matches
              </span>
            </div>
          </div>
        </section>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Log a completed flight */}
          <section className="lg:col-span-7 card p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-md bg-red-50 text-[#c8102e] flex items-center justify-center">
                <Icon name="flight" size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Log a Completed Flight
                </h2>
                <p className="text-xs text-slate-500">
                  Enter the flight details you remember. Matches require the same flight, direction, date, and sharing consent from both members.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Quick-fill examples — confirm these match your completed trip:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ROUTES.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => handleApplyPreset(r)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition border cursor-pointer ${
                      flightNumber === r.code && origin === r.from
                        ? "bg-[#c8102e] text-white border-[#c8102e]"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {r.code} ({r.from}➔{r.to})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flight Number
                  </label>
                  <input
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. KQ 102"
                    maxLength={8}
                    pattern="KQ\s?\d{1,4}[A-Za-z]?"
                    title="Enter a Kenya Airways flight number, such as KQ 102"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#c8102e]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origin Station
                  </label>
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    placeholder="NBO"
                    maxLength={3}
                    pattern="[A-Za-z]{3}"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#c8102e]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination
                  </label>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    placeholder="LHR"
                    maxLength={3}
                    pattern="[A-Za-z]{3}"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#c8102e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Travel
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    max={maxTravelDate}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm outline-none focus:bg-white focus:border-[#c8102e]"
                    required
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">Only dates before today are accepted. Future or same-day trips can’t be logged.</p>
                </div>
              </div>

              {/* Explicit, revocable sharing consent */}
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentToShare}
                  onChange={(e) => setConsentToShare(e.target.checked)}
                  className="mt-0.5 accent-[#c8102e] w-4 h-4 rounded"
                />
                <div className="text-xs">
                  <b className="text-slate-900 block font-bold">
                    Let verified members with the exact same flight find me
                  </b>
                  <span className="text-slate-500 leading-relaxed block mt-0.5">
                    Off by default. If enabled, your name, role, department, flight number, route, and travel date can appear to other verified members who also opted in. Email and phone number are not shared here. You can turn matching off or delete this trip later.
                  </span>
                </div>
              </label>

              {error && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">
                  {error}
                </div>
              )}

              {postSuccess && (
                <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{postSuccess}</span>
                </div>
              )}

              <Button type="submit" disabled={posting} className="w-full">
                {posting ? "Saving completed flight…" : "Save completed flight"}
              </Button>
            </form>
          </section>

          {/* Active Logged Itineraries */}
          <section className="lg:col-span-5 card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Your Logged Trips
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {myFlights.length} total
              </span>
            </div>

            {myFlights.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 space-y-2">
                <Icon name="flight" size={24} className="mx-auto text-slate-400" />
                <p>You haven’t logged a completed flight yet.</p>
                <p className="text-slate-400">
                  Your trip remains private unless you turn on exact-flight matching.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myFlights.map((flight) => {
                  const d = new Date(flight.travelDate);
                  const day = new Intl.DateTimeFormat("en", { day: "2-digit", timeZone: "UTC" }).format(d);
                  const month = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(d).toUpperCase();
                  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "UTC" }).format(d);
                  const canMatch = Boolean(flight.flightNumber && flight.origin && flight.destination);

                  return (
                    <div
                      key={flight.id}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-[#0e2740] text-white flex flex-col items-center justify-center font-bold shrink-0">
                            <b className="text-xs leading-none">{day}</b>
                            <small className="text-[9px] uppercase font-bold text-[#c59b27]">{month}</small>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-[#c8102e] uppercase tracking-wider">
                              {canMatch ? "KENYA AIRWAYS · COMPLETED FLIGHT" : "OLDER TRIP RECORD"}
                            </div>
                            <b className="block truncate text-sm font-bold text-slate-900">
                              {canMatch ? `${flight.flightNumber} · ${flight.origin} → ${flight.destination}` : flight.flightRoute}
                            </b>
                            <small className="text-xs text-slate-500">Travel date: {month} {day}, {year}</small>
                          </div>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${flight.consentToShare && canMatch ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                          {flight.consentToShare && canMatch ? "Visible to exact-flight matches" : canMatch ? "Private" : "Not matchable"}
                        </span>
                      </div>
                      {!canMatch && <p className="text-xs text-amber-800">This older trip has no structured flight details. Delete it and log it again to enable exact-flight matching.</p>}
                      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          disabled={(!canMatch && !flight.consentToShare) || updatingFlightId === flight.id || deletingFlightId === flight.id}
                          onClick={() => updateFlightConsent(flight)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#c8102e] hover:text-[#c8102e] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingFlightId === flight.id ? "Updating…" : flight.consentToShare ? "Stop sharing" : "Enable matching"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingFlightId === flight.id || updatingFlightId === flight.id}
                          onClick={() => deleteFlight(flight)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingFlightId === flight.id ? "Removing…" : "Remove trip"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Discovered Route Connections */}
        <section className="card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#c8102e] mb-0.5">
                Exact-flight matching
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {matches.length} opted-in profile{matches.length === 1 ? "" : "s"} from your flight
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-[#c59b27] border border-amber-200 text-xs font-bold">
              <Icon name="shield" size={13} />
              <span>Both members must opt in</span>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Icon name="users" size={20} />
              </div>
              <b className="block text-slate-800 text-sm">No exact-flight matches yet</b>
              <p className="max-w-md mx-auto text-slate-500">
                A match appears only when another verified member logs the same flight number, direction, and past travel date, and both of you enable matching. Flight details are member-entered and aren’t checked against an airline schedule.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matches.map((m) => (
                <article
                  key={`${m.userId}:${m.flightNumber}:${m.travelDate}`}
                  className="card p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700">
                        Verified account · opted in
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Avatar name={m.fullName} size="md" role={m.role} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {m.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {m.department || "Department not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2 font-mono">
                      <span className="min-w-0 truncate text-slate-600">Flight: <b>{m.flightNumber}</b> · {m.origin} → {m.destination}</span>
                      <span className="shrink-0 text-[#c8102e] font-bold">
                        {new Date(m.travelDate).toLocaleDateString(undefined, { timeZone: "UTC" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">The flight details were entered by members; the platform does not verify airline schedules or boarding.</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {m.connectionStatus === "ACCEPTED" ? (
                      <Link href="/messages" className="w-full btn btn-primary text-xs py-2 rounded-md flex items-center justify-center gap-1.5">
                        <Icon name="message" size={14} /><span>Open conversation</span>
                      </Link>
                    ) : m.connectionStatus === "PENDING" && m.connectionDirection === "SENT" ? (
                      <button type="button" disabled className="w-full btn btn-secondary text-xs py-2 rounded-md opacity-80 cursor-not-allowed">
                        Request pending
                      </button>
                    ) : m.connectionStatus === "PENDING" && m.connectionDirection === "RECEIVED" ? (
                      <Link href="/requests" className="w-full btn btn-secondary text-xs py-2 rounded-md flex items-center justify-center">
                        Review their request
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setSelectedPeer(m); setHandshakeError(""); setHandshakeSuccess(""); }}
                        className="w-full btn btn-primary text-xs py-2 rounded-md flex items-center justify-center gap-1.5"
                      >
                        <Icon name="profile" size={14} />
                        <span>{m.connectionStatus === "DECLINED" ? "Send a new connection request" : "Request to connect"}</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Handshake Dialog */}
        {selectedPeer && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedPeer(null)}
          >
            <div
              className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPeer(null)}
                className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <Icon name="close" size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#0e2740] text-[#c59b27] flex items-center justify-center">
                  <Icon name="flight" size={20} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#c8102e]">
                    Flight Reconnect · Connection Request
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Connect with {selectedPeer.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Same logged flight: {selectedPeer.flightNumber} · {selectedPeer.origin} → {selectedPeer.destination}
                  </p>
                </div>
              </div>

              {handshakeSuccess && (
                <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{handshakeSuccess}</span>
                </div>
              )}
              {handshakeError && <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">{handshakeError}</div>}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Introduction Note
                </label>
                <textarea
                  rows={4}
                  value={handshakeMessage}
                  onChange={(e) => setHandshakeMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm outline-none focus:bg-white focus:border-[#c8102e] resize-none"
                />
                <p className="text-xs text-slate-500 leading-snug">
                  This sends a normal connection request. Once accepted, you can continue privately in Messages.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <Button onClick={handleSendHandshake} disabled={sendingHandshake || Boolean(handshakeSuccess)}>
                  {sendingHandshake ? "Sending…" : handshakeSuccess ? "Request sent" : "Send connection request"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KQAppShell>
  );
}
