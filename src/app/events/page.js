"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Tag } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

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
      try {
        const res = await fetch("/api/events");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load events");
          setLoading(false);
          return;
        }

        setEvents(data.events || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
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

    try {
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
    } catch (err) {
      setPosting(false);
      setPostError(err.message);
    }
  };

  const toggleRsvp = async (eventId, currentlyJoined) => {
    setRsvpPendingId(eventId);

    try {
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
    } catch {
      setRsvpPendingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="app-page">
          <div className="p-12 text-center text-gray-500 font-medium">
            <Icon name="events" size={28} className="mx-auto mb-3 text-[#bb162b] animate-spin" />
            Loading aviation events and masterclasses...
          </div>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="app-page">
        {/* Title */}
        <div className="page-title">
          <div>
            <div className="eyebrow">COMMUNITY &amp; LEARNING</div>
            <h1>Aviation Events &amp; Masterclasses</h1>
            <p>
              Pride Centre seminars, crew workshops, alumni reunions, and technical masterclasses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Create an Event Card */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              className="card p-6 sticky top-24 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="p-2 bg-[#c8102e]/10 text-[#c8102e] rounded-lg">
                  <Icon name="events" size={16} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Create an Event</h2>
                  <p className="text-slate-500 text-xs">Host an aviation seminar or reunion</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Title
                  </label>
                  <input
                    name="title"
                    placeholder="e.g. B787 Dreamliner Systems Masterclass"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Agenda, keynote speakers, and learning objectives..."
                    value={form.description}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location / Platform
                  </label>
                  <input
                    name="location"
                    placeholder="e.g. Pride Centre Auditorium, Nairobi (or Teams link)"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    name="eventDate"
                    value={form.eventDate}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition text-slate-800"
                    required
                  />
                </div>

                {postError && (
                  <p className="text-red-700 text-xs bg-red-50 border border-red-200 p-2.5 rounded-lg">
                    {postError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={posting}
                  className="w-full"
                  icon="arrow"
                >
                  {posting ? "Scheduling..." : "Schedule Event"}
                </Button>
              </div>
            </form>
          </div>

          {/* List of Events */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Upcoming Community Events ({events.length})
              </span>
            </div>

            {error ? (
              <p className="text-red-600 text-sm">{error}</p>
            ) : events.length === 0 ? (
              <div className="p-12 text-center card text-slate-500">
                No events scheduled yet. Create an event to gather peers and mentees!
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((e) => {
                  const d = new Date(e.eventDate);
                  const isPending = rsvpPendingId === e.id;

                  return (
                    <article
                      key={e.id}
                      className="card p-5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-bold text-base text-slate-900">{e.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Icon name="calendar" size={12} />
                              {d.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>·</span>
                            <span>{e.location}</span>
                          </div>
                        </div>
                        <Tag gold={e.isJoined}>
                          {e.participantCount} {e.participantCount === 1 ? "Attending" : "Attending"}
                        </Tag>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed mt-3 whitespace-pre-wrap">
                        {e.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Organized by {e.createdByName}
                        </span>

                        <Button
                          variant={e.isJoined ? "secondary" : "primary"}
                          onClick={() => toggleRsvp(e.id, e.isJoined)}
                          disabled={isPending}
                          className="text-xs py-1.5 px-3 min-h-0"
                        >
                          {isPending
                            ? "Updating..."
                            : e.isJoined
                            ? "Cancel RSVP"
                            : "RSVP to Attend"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </KQAppShell>
  );
}
