"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Tag, Avatar } from "@/components/KQBrand";
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
  const [seatClass, setSeatClass] = useState("BUSINESS");
  const [consentToShare, setConsentToShare] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState("");

  // Handshake Modal
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [handshakeMessage, setHandshakeMessage] = useState(
    "Hello! I saw we are on the same Kenya Airways flight. I would value connecting before departure or during layover to exchange aviation insights."
  );
  const [sendingHandshake, setSendingHandshake] = useState(false);
  const [handshakeSuccess, setHandshakeSuccess] = useState("");

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
    setFlightNumber(r.code);
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
          flightNumber,
          origin,
          destination,
          travelDate,
          seatClass,
          consentToShare,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to log flight itinerary");
      } else {
        setPostSuccess("Flight route registered. Scanning for peer matches...");
        refreshData();
        setTimeout(() => setPostSuccess(""), 2500);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleSendHandshake = async () => {
    if (!selectedPeer) return;
    setSendingHandshake(true);
    setHandshakeSuccess("");

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
        alert(data.error || "Failed to initiate handshake");
      } else {
        setHandshakeSuccess("Handshake invitation dispatched!");
        setTimeout(() => {
          setSelectedPeer(null);
          setHandshakeSuccess("");
        }, 1600);
      }
    } catch (err) {
      alert("Error: " + err.message);
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
              In-Transit Professional Networking
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Turn Travel Into Professional Synergy
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Match securely with verified Pride Centre alumni, active crew, and Asante frequent flyers traveling on the same scheduled Kenya Airways flights.
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
          {/* Add Upcoming Flight Panel */}
          <section className="lg:col-span-7 card p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-md bg-red-50 text-[#c8102e] flex items-center justify-center">
                <Icon name="flight" size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Log Upcoming Flight Itinerary
                </h2>
                <p className="text-xs text-slate-500">
                  Select your flight details to scan for fellow stakeholders on board.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Popular Kenya Airways Routes:
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
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. KQ 102"
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
                    maxLength={4}
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
                    maxLength={4}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#c8102e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Travel
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm outline-none focus:bg-white focus:border-[#c8102e]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cabin Category
                  </label>
                  <select
                    value={seatClass}
                    onChange={(e) => setSeatClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm outline-none focus:border-[#c8102e] text-slate-700"
                  >
                    <option value="BUSINESS">Premier World / Business Class</option>
                    <option value="ECONOMY">Economy Class</option>
                    <option value="CREW">Flight Deck / Cabin Crew</option>
                    <option value="OPERATIONS">Ground Operations Staff</option>
                  </select>
                </div>
              </div>

              {/* Zero-Knowledge Privacy Consent */}
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentToShare}
                  onChange={(e) => setConsentToShare(e.target.checked)}
                  className="mt-0.5 accent-[#c8102e] w-4 h-4 rounded"
                />
                <div className="text-xs">
                  <b className="text-slate-900 block font-bold">
                    Consent to anonymous route matching
                  </b>
                  <span className="text-slate-500 leading-relaxed block mt-0.5">
                    Your seat number, ticket ID, and personal contacts remain protected until you mutually confirm an in-transit handshake.
                  </span>
                </div>
              </label>

              {postSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{postSuccess}</span>
                </div>
              )}

              <Button type="submit" disabled={posting} className="w-full">
                {posting ? "Scanning Flight Schedule..." : "Register Route & Scan for Peers"}
              </Button>
            </form>
          </section>

          {/* Active Logged Itineraries */}
          <section className="lg:col-span-5 card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Registered Flights
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {myFlights.length} active
              </span>
            </div>

            {myFlights.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 space-y-2">
                <Icon name="flight" size={24} className="mx-auto text-slate-400" />
                <p>No active flight itineraries recorded yet.</p>
                <p className="text-slate-400">
                  Register your flight above to discover colleagues traveling on your route.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myFlights.map((flight) => {
                  const d = new Date(flight.travelDate);
                  const day = d.getDate();
                  const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
                  const year = d.getFullYear();

                  return (
                    <div
                      key={flight.id}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#0e2740] text-white flex flex-col items-center justify-center font-bold shrink-0">
                          <b className="text-xs leading-none">{day}</b>
                          <small className="text-[9px] uppercase font-bold text-[#c59b27]">
                            {month}
                          </small>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[#c8102e] uppercase tracking-wider">
                            KENYA AIRWAYS
                          </div>
                          <b className="text-sm font-bold text-slate-900 block">
                            {flight.flightRoute}
                          </b>
                          <small className="text-xs text-slate-500">
                            Travel: {month} {day}, {year}
                          </small>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                          Active
                        </span>
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
                Route Matching
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {matches.length} Verified Peer Matches on Your Route
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-[#c59b27] border border-amber-200 text-xs font-bold">
              <Icon name="shield" size={13} />
              <span>Bilateral Consent Required</span>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Icon name="users" size={20} />
              </div>
              <b className="block text-slate-800 text-sm">No Matching Travelers Found Yet</b>
              <p className="max-w-md mx-auto text-slate-500">
                When another verified Kenya Airways stakeholder logs an itinerary matching your route and date, they will be surfaced here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matches.map((m, idx) => (
                <article
                  key={idx}
                  className="card p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700">
                        Verified Peer
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Avatar name={m.fullName} size="md" role={m.role} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {m.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {m.department || "Kenya Airways Aviation Specialist"}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between font-mono">
                      <span className="text-slate-600">Route: <b>{m.flightRoute}</b></span>
                      <span className="text-[#c8102e] font-bold">
                        {new Date(m.travelDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPeer(m)}
                      className="w-full btn btn-primary text-xs py-2 rounded-md flex items-center justify-center gap-1.5"
                    >
                      <Icon name="flight" size={14} />
                      <span>Connect In-Transit</span>
                    </button>
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
                    Flight Reconnect Handshake
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Connect with {selectedPeer.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Traveling on {selectedPeer.flightRoute}
                  </p>
                </div>
              </div>

              {handshakeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{handshakeSuccess}</span>
                </div>
              )}

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
                <p className="text-xs text-slate-400 leading-snug">
                  Both travelers must accept this request before direct contact channels are shared.
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
                <Button onClick={handleSendHandshake} disabled={sendingHandshake}>
                  {sendingHandshake ? "Sending..." : "Send Handshake"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KQAppShell>
  );
}
