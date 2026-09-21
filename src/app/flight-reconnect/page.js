"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FlightReconnectPage() {
  const { status } = useSession();
  const router = useRouter();

  const [myFlights, setMyFlights] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    flightRoute: "",
    travelDate: "",
    consentToShare: false,
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      const res = await fetch("/api/flight-reconnect");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not load flight reconnect data");
        setLoading(false);
        return;
      }

      setMyFlights(data.myFlights);
      setMatches(data.matches);
      setLoading(false);
    }

    load();
  }, [status]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostError("");

    const res = await fetch("/api/flight-reconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    setPosting(false);

    if (!res.ok) {
      setPostError(data.error || "Could not log flight");
      return;
    }

    setMyFlights((prev) => [...prev, data.flight]);
    setForm({ flightRoute: "", travelDate: "", consentToShare: false });
  };

  const handleRemove = async (id) => {
    const res = await fetch(`/api/flight-reconnect/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setMyFlights((prev) => prev.filter((f) => f.id !== id));
  };

  if (status === "loading" || loading) {
    return <div className="max-w-2xl mx-auto mt-16 p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Flight Reconnect</h1>
        <p className="text-gray-500 text-sm">
          Log a route and date to find other verified stakeholders on the
          same flight. Only visible to you unless you opt in to sharing --
          and only matched against others who&apos;ve also opted in. Remove a
          logged flight any time to withdraw it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border rounded-lg p-4">
        <h2 className="font-semibold">Log a flight</h2>
        <div>
          <label className="block text-sm font-medium mb-1">
            Route (e.g. NBO-LHR)
          </label>
          <input
            name="flightRoute"
            value={form.flightRoute}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="travelDate"
            value={form.travelDate}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="consentToShare"
            checked={form.consentToShare}
            onChange={handleChange}
          />
          Share this with other verified stakeholders on the same flight
        </label>
        {postError && <p className="text-red-600 text-sm">{postError}</p>}
        <button
          type="submit"
          disabled={posting}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50 w-fit"
        >
          {posting ? "Logging..." : "Log flight"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <section>
        <h2 className="text-lg font-semibold mb-3">My logged flights</h2>
        {myFlights.length === 0 ? (
          <p className="text-gray-500 text-sm">No flights logged yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {myFlights.map((f) => (
              <div
                key={f.id}
                className="border rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold">{f.flightRoute}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(f.travelDate).toLocaleDateString()}
                    {f.consentToShare ? " -- shared" : " -- private"}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(f.id)}
                  className="text-xs border rounded px-3 py-1 shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Matches</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No matches yet -- opt in on a logged flight to find others on the
            same route and date.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((m, i) => (
              <div key={`${m.userId}-${i}`} className="border rounded-lg p-4">
                <p className="font-semibold">{m.fullName}</p>
                <p className="text-sm text-gray-600">
                  {m.flightRoute} -- {new Date(m.travelDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
