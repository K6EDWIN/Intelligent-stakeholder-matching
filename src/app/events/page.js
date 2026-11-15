"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Tag } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import ReportButton from "@/components/ReportButton";
import { readApiResponse } from "@/lib/read-api-response";

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
    bannerUrl: "",
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postNotice, setPostNotice] = useState("");
  const [rsvpPendingId, setRsvpPendingId] = useState(null);
  const [rsvpError, setRsvpError] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [bannerName, setBannerName] = useState("");
  const [highlightedEventId, setHighlightedEventId] = useState("");

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
        const data = await readApiResponse(res, "Could not load events");

        setEvents(data.events || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    load();
  }, [status]);

  useEffect(() => {
    if (!events.length || typeof window === "undefined") return;
    const eventId = new URLSearchParams(window.location.search).get("eventId");
    if (!eventId || !events.some((event) => event.id === eventId)) return;
    const highlightFrame = window.requestAnimationFrame(() => setHighlightedEventId(eventId));
    const scrollTimer = window.setTimeout(() => document.getElementById(`event-${eventId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    return () => {
      window.cancelAnimationFrame(highlightFrame);
      window.clearTimeout(scrollTimer);
    };
  }, [events]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerError("");
    setBannerName("");
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append("banner", file);
      const response = await fetch("/api/events/banner", { method: "POST", body: formData });
      const data = await readApiResponse(response, "Could not upload event banner");
      setForm((current) => ({ ...current, bannerUrl: data.url }));
      setBannerName(file.name);
    } catch (err) {
      setBannerError(err.message);
      e.target.value = "";
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostError("");
    setPostNotice("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readApiResponse(res, "Could not create event");

      setPosting(false);

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
      setForm({ title: "", description: "", location: "", eventDate: "", bannerUrl: "" });
      setBannerName("");
      setPostNotice(data.announcement?.failed
        ? `Event published, but its email announcement was incomplete (${data.announcement.recipientCount} of ${data.announcement.totalRecipients} sent). Check the email settings and contact an administrator to notify remaining members.`
        : data.announcement?.recipientCount
        ? `Event published. Email announcement sent to ${data.announcement.recipientCount} members.`
        : "Event published. There were no other active members to notify.");
    } catch (err) {
      setPosting(false);
      setPostError(err.message);
    }
  };

  const toggleRsvp = async (eventId, currentlyJoined) => {
    setRsvpPendingId(eventId);
    setRsvpError("");

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: currentlyJoined ? "DELETE" : "POST",
      });

      setRsvpPendingId(null);

      if (!res.ok) {
        const data = await readApiResponse(res, "Could not update your RSVP");
        setRsvpError(data.error || "Could not update your RSVP. Please try again.");
        return;
      }

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
    } catch (error) {
      setRsvpError(error.message || "We could not reach the server. Check your connection and try again.");
    } finally {
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
                  <label htmlFor="event-title" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Title
                  </label>
                  <input
                    name="title"
                    id="event-title"
                    placeholder="e.g. B787 Dreamliner Systems Masterclass"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="event-description" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="event-description"
                    placeholder="Agenda, keynote speakers, and learning objectives..."
                    value={form.description}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="event-location" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location / Platform
                  </label>
                  <input
                    name="location"
                    id="event-location"
                    placeholder="e.g. Pride Centre Auditorium, Nairobi (or Teams link)"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="event-date" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    name="eventDate"
                    id="event-date"
                    value={form.eventDate}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="event-banner" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Event Banner <span className="font-normal normal-case text-slate-500">(optional)</span></label>
                  <input id="event-banner" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerChange} disabled={bannerUploading || posting} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200" aria-describedby="event-banner-help" />
                  <p id="event-banner-help" className="mt-1 text-xs text-slate-500">JPG, PNG or WebP, up to 4 MB. It appears on the event and announcement email.</p>
                  {bannerUploading && <p role="status" className="mt-2 text-xs text-slate-600">Uploading banner…</p>}
                  {bannerName && <p role="status" className="mt-2 text-xs text-emerald-700">Banner ready: {bannerName}</p>}
                  {bannerError && <p role="alert" className="mt-2 text-xs text-red-700">{bannerError}</p>}
                  {form.bannerUrl && <Image src={form.bannerUrl} alt="Preview of event banner" width={1280} height={640} unoptimized className="mt-3 max-h-40 w-full rounded-lg border border-slate-200 object-cover" />}
                </div>

                {postError && (
                  <p role="alert" className="text-red-700 text-xs bg-red-50 border border-red-200 p-2.5 rounded-lg">
                    {postError}
                  </p>
                )}
                {postNotice && <p role="status" className={`text-xs p-2.5 rounded-lg ${postNotice.startsWith("Event published, but") ? "text-amber-900 bg-amber-50 border border-amber-200" : "text-emerald-800 bg-emerald-50 border border-emerald-200"}`}>{postNotice}</p>}

                <Button
                  type="submit"
                  disabled={posting || bannerUploading}
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

            {rsvpError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{rsvpError}</p>}

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
                      id={`event-${e.id}`}
                      className={`card overflow-hidden p-5 transition ${highlightedEventId === e.id ? "border-[#c8102e] ring-2 ring-[#c8102e]/20" : "hover:border-slate-300"}`}
                    >
                      {e.bannerUrl && <Image src={e.bannerUrl} alt={`${e.title} banner`} width={1280} height={640} unoptimized className="-mx-5 -mt-5 mb-4 max-h-72 w-[calc(100%+2.5rem)] object-cover" />}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-base text-slate-900">{e.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
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
                            <span className="min-w-0 break-words">{e.location}</span>
                          </div>
                        </div>
                        <Tag gold={e.isJoined} className="shrink-0">
                          {e.participantCount} {e.participantCount === 1 ? "attendee" : "attendees"}
                        </Tag>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed mt-3 whitespace-pre-wrap">
                        {e.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 flex-1 text-slate-500">
                          Organized by {e.createdByName}
                        </span>

                        <Button
                          variant={e.isJoined ? "secondary" : "primary"}
                          onClick={() => toggleRsvp(e.id, e.isJoined)}
                          disabled={isPending}
                          className="text-xs py-1.5 px-3 min-h-0 w-full sm:w-auto"
                        >
                          {isPending
                            ? "Updating..."
                            : e.isJoined
                            ? "Cancel RSVP"
                            : "RSVP to Attend"}
                        </Button>
                        <a href={`/events?eventId=${encodeURIComponent(e.id)}`} className="rounded-lg border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700 hover:bg-slate-50">Event link</a>
                      </div>
                      <ReportButton targetType="EVENT" targetId={e.id} />
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
