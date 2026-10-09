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
    "Hello! I saw we are on the same Kenya Airways flight. I'd love to connect before boarding or in transit to exchange aviation insights."
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

  const handleApplyPreset = (route) => {
    setFlightNumber(route.code);
    setOrigin(route.from);
    setDestination(route.to);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!travelDate) {
      alert("Please select your travel date");
      return;
    }

    setPosting(true);
    setPostSuccess("");

    const fullRoute = `${flightNumber.toUpperCase()} ${origin.toUpperCase()}-${destination.toUpperCase()}`.trim();

    try {
      const res = await fetch("/api/flight-reconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightRoute: fullRoute,
          travelDate,
          consentToShare,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not save flight itinerary");
      } else {
        setPostSuccess("Flight logged! Our recommender has scanned this route for peers.");
        loadData();
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
      const res = await fetch("/api/mentorship-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedPeer.userId,
          message: `[Flight Reconnect: ${selectedPeer.flightRoute} on ${new Date(selectedPeer.travelDate).toLocaleDateString()}] ${handshakeMessage}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to initiate in-transit handshake");
      } else {
        setHandshakeSuccess("Handshake request dispatched! Identities will unlock upon acceptance.");
        setTimeout(() => {
          setSelectedPeer(null);
          setHandshakeSuccess("");
        }, 2000);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0e2740] text-[#e5b842] flex items-center justify-center animate-bounce">
            <Icon name="flight" size={32} />
          </div>
          <h2 className="text-xl font-bold font-['Fraunces',serif] text-[#0e2740]">
            Scanning Kenya Airways Flight Itineraries...
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Verifying scheduled routes and zero-knowledge mutual passenger consent.
          </p>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Aviation Hero Banner */}
        <section className="rounded-3xl bg-[#0e2740] text-white p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#e5b842] text-[10px] font-bold uppercase tracking-wider">
              <Icon name="flight" size={13} />
              In-Transit Professional Networking
            </div>
            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-normal leading-tight">
              Turn Travel Into <span className="text-[#e5b842]">Professional Synergy.</span>
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Match securely with verified Pride Centre alumni, active crew, and Asante frequent flyers traveling on the same scheduled KQ flights.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center min-w-[130px]">
              <b className="block text-2xl font-['Fraunces',serif] text-[#e5b842]">
                {myFlights.length}
              </b>
              <span className="text-[10px] uppercase tracking-wider text-gray-300">
                Logged Routes
              </span>
            </div>
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center min-w-[130px]">
              <b className="block text-2xl font-['Fraunces',serif] text-[#1b8755]">
                {matches.length}
              </b>
              <span className="text-[10px] uppercase tracking-wider text-gray-300">
                Peer Matches
              </span>
            </div>
          </div>
        </section>

        {/* Layout Grid: Logger on Left, Logged Tickets on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Upcoming Flight Panel */}
          <section className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#dce0e3] shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#bb162b]/10 text-[#bb162b] flex items-center justify-center">
                <Icon name="flight" size={20} />
              </div>
              <div>
                <h2 className="font-['Fraunces',serif] text-xl font-bold text-[#0e2740]">
                  Log an Upcoming KQ Itinerary
                </h2>
                <p className="text-xs text-gray-500">
                  Select your flight details to scan for fellow stakeholders on board.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Popular KQ Routes (Quick Select)
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_ROUTES.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => handleApplyPreset(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                      flightNumber === r.code && origin === r.from
                        ? "bg-[#bb162b] text-white border-[#bb162b]"
                        : "bg-[#fbf9f5] border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {r.code} ({r.from}➔{r.to})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Flight Number
                  </label>
                  <input
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. KQ 102"
                    className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#bb162b]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Origin Station
                  </label>
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    placeholder="NBO"
                    maxLength={4}
                    className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#bb162b]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Destination
                  </label>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    placeholder="LHR"
                    maxLength={4}
                    className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-[#bb162b]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Date of Travel
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#bb162b]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Travel Cabin / Persona
                  </label>
                  <select
                    value={seatClass}
                    onChange={(e) => setSeatClass(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm outline-none focus:border-[#bb162b] text-gray-700"
                  >
                    <option value="BUSINESS">Premier World / Business Class</option>
                    <option value="ECONOMY">Economy Class</option>
                    <option value="CREW">Flight Deck / Cabin Crew</option>
                    <option value="OPERATIONS">Aviation Ground Ops Staff</option>
                  </select>
                </div>
              </div>

              {/* Zero-Knowledge Privacy Consent */}
              <label className="flex items-start gap-3 p-3.5 bg-[#fbf9f5] border border-[#e2e6e9] rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentToShare}
                  onChange={(e) => setConsentToShare(e.target.checked)}
                  className="mt-0.5 accent-[#bb162b] w-4 h-4 rounded"
                />
                <div className="text-xs">
                  <b className="text-gray-900 block font-bold">
                    Consent to anonymous route matching
                  </b>
                  <span className="text-gray-500 leading-relaxed block mt-0.5">
                    Your seat number, ticket ID, and personal contact info remain confidential until you mutually confirm an in-transit handshake request.
                  </span>
                </div>
              </label>

              {postSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#1b8755] text-xs rounded-xl flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{postSuccess}</span>
                </div>
              )}

              <Button type="submit" disabled={posting} className="w-full">
                {posting ? "Scanning Flight Schedule..." : "Log Route & Scan for Peers"}
              </Button>
            </form>
          </section>

          {/* Active Logged Itineraries */}
          <section className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#dce0e3] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="font-['Fraunces',serif] text-xl font-bold text-[#0e2740]">
                My Boarding Passes
              </h2>
              <span className="text-xs font-semibold text-gray-500">
                {myFlights.length} registered
              </span>
            </div>

            {myFlights.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                <Icon name="flight" size={28} className="mx-auto text-gray-400" />
                <p>No active flight itineraries recorded yet.</p>
                <p className="text-[11px] text-gray-400">
                  Log your scheduled flights above to discover colleagues traveling with you.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myFlights.map((flight) => {
                  const d = new Date(flight.travelDate);
                  const day = d.getDate();
                  const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
                  const year = d.getFullYear();

                  return (
                    <div
                      key={flight.id}
                      className="p-4 rounded-2xl bg-[#fbf9f5] border border-[#dce0e3] flex items-center justify-between gap-3 transition hover:border-gray-400"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#0e2740] text-white flex flex-col items-center justify-center font-['Fraunces',serif] shadow-sm shrink-0">
                          <b className="text-base leading-none">{day}</b>
                          <small className="text-[9px] uppercase font-bold text-[#e5b842]">
                            {month}
                          </small>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[#bb162b] uppercase tracking-wider">
                            KENYA AIRWAYS
                          </div>
                          <b className="text-sm font-bold text-[#0e2740] block">
                            {flight.flightRoute}
                          </b>
                          <small className="text-[10px] text-gray-500">
                            Travel: {month} {day}, {year}
                          </small>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1b8755] text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1b8755] animate-ping" />
                          Matching Active
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
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[#dce0e3] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#bb162b] mb-1">
                <Icon name="users" size={13} />
                Mutual Route Discovery
              </div>
              <h2 className="font-['Fraunces',serif] text-2xl font-bold text-[#0e2740]">
                {matches.length} Verified Peer Matches on Your Route
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-[#c59b27] border border-amber-200 text-xs font-bold">
              <Icon name="shield" size={14} />
              <span>Bilateral Consent Enforced</span>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="py-14 text-center text-xs text-gray-500 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                <Icon name="users" size={24} />
              </div>
              <b className="block text-gray-800 text-sm">No Matching Travelers Found Yet</b>
              <p className="max-w-md mx-auto text-gray-500">
                When another verified Kenya Airways stakeholder logs an itinerary matching your route and date, they will be surfaced here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matches.map((m, idx) => (
                <article
                  key={idx}
                  className="bg-[#fbf9f5] border border-[#dce0e3] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:border-gray-400 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 uppercase tracking-wider">
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1b8755]">
                        <Icon name="shield" size={12} />
                        Verified Peer
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <Avatar name={m.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-['Fraunces',serif] text-base font-bold text-[#0e2740] truncate">
                          {m.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {m.department || "Kenya Airways Aviation Specialist"}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs flex items-center justify-between font-mono">
                      <span className="text-gray-600">Route: <b>{m.flightRoute}</b></span>
                      <span className="text-[#bb162b] font-bold">
                        {new Date(m.travelDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => setSelectedPeer(m)}
                      className="w-full btn btn-primary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Icon name="flight" size={14} />
                      <span>Initiate In-Transit Handshake</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Handshake Confirmation Dialog */}
        {selectedPeer && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setSelectedPeer(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPeer(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <Icon name="close" size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0e2740] text-[#e5b842] flex items-center justify-center">
                  <Icon name="flight" size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bb162b]">
                    Flight Reconnect Handshake
                  </span>
                  <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#0e2740]">
                    Connect with {selectedPeer.fullName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Traveling on {selectedPeer.flightRoute}
                  </p>
                </div>
              </div>

              {handshakeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#1b8755] text-xs rounded-xl flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{handshakeSuccess}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  In-Transit Introduction Note
                </label>
                <textarea
                  rows={4}
                  value={handshakeMessage}
                  onChange={(e) => setHandshakeMessage(e.target.value)}
                  className="w-full p-3 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#bb162b] resize-none"
                />
                <p className="text-[11px] text-gray-400 leading-snug">
                  Both passengers must accept this handshake before personal contact channels or airport lounge meeting locations are disclosed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeer(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Cancel
                </button>
                <Button onClick={handleSendHandshake} disabled={sendingHandshake}>
                  {sendingHandshake ? "Sending..." : "Dispatch Handshake Request"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KQAppShell>
  );
}
