"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: "",
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [rsvpPendingId, setRsvpPendingId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      const res = await fetch("/api/events");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not load events");
        setLoading(false);
        return;
      }

      setEvents(data.events);
      setLoading(false);
    }

    load();
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostError("");

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    setPosting(false);

    if (!res.ok) {
      setPostError(data.error || "Could not create event");
      return;
    }

    setEvents((prev) =>
      [
        {
          ...data.event,
          createdByName: "You",
          participantCount: 0,
          isJoined: false,
        },
        ...prev,
      ].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    );
    setForm({ title: "", description: "", location: "", eventDate: "" });
  };

  const toggleRsvp = async (eventId, currentlyJoined) => {
    setRsvpPendingId(eventId);

    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: currentlyJoined ? "DELETE" : "POST",
    });

    setRsvpPendingId(null);

    if (!res.ok) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isJoined: !currentlyJoined,
              participantCount: e.participantCount + (currentlyJoined ? -1 : 1),
            }
          : e
      )
    );
  };

  if (status === "loading" || loading) {
    return <div className="max-w-2xl mx-auto mt-16 p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Events</h1>
        <p className="text-gray-500 text-sm">
          Workshops, reunions, and other community events. RSVP to let
          organizers know you&apos;re coming.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border rounded-lg p-4">
        <h2 className="font-semibold">Create an event</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date &amp; time</label>
          <input
            type="datetime-local"
            name="eventDate"
            value={form.eventDate}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        {postError && <p className="text-red-600 text-sm">{postError}</p>}
        <button
          type="submit"
          disabled={posting}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50 w-fit"
        >
          {posting ? "Creating..." : "Create event"}
        </button>
      </form>

      {error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No events yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((e) => (
            <div
              key={e.id}
              className="border rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-gray-600">
                  {new Date(e.eventDate).toLocaleString()}
                  {e.location ? ` -- ${e.location}` : ""}
                </p>
                {e.description && (
                  <p className="text-sm text-gray-700 mt-1">{e.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {e.participantCount} going -- created by {e.createdByName}
                </p>
              </div>
              <button
                onClick={() => toggleRsvp(e.id, e.isJoined)}
                disabled={rsvpPendingId === e.id}
                className={`text-xs rounded px-3 py-1 shrink-0 disabled:opacity-50 ${
                  e.isJoined ? "border" : "bg-black text-white"
                }`}
              >
                {e.isJoined ? "Cancel RSVP" : "RSVP"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
