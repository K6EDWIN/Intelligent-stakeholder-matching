"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Tag } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

const TYPE_OPTIONS = [
  "Career Opening",
  "Internship",
  "Industry Workshop",
  "Alumni Reunion",
];

export default function OpportunitiesPage() {
  const { status } = useSession();
  const router = useRouter();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: TYPE_OPTIONS[0],
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
      try {
        const res = await fetch("/api/opportunities");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load opportunities");
          setLoading(false);
          return;
        }

        setOpportunities(data.opportunities || []);
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
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      setPosting(false);

      if (!res.ok) {
        setPostError(data.error || "Could not post opportunity");
        return;
      }

      setOpportunities((prev) => [
        { ...data.opportunity, postedBy: { profile: { fullName: "You" } } },
        ...prev,
      ]);
      setForm({ title: "", description: "", type: TYPE_OPTIONS[0] });
    } catch (err) {
      setPosting(false);
      setPostError(err.message);
    }
  };

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="app-page">
          <div className="p-12 text-center text-gray-500 font-medium">
            <Icon name="opportunity" size={28} className="mx-auto mb-3 text-[#bb162b] animate-spin" />
            Loading opportunities board...
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
            <div className="eyebrow">CAREER &amp; GROWTH</div>
            <h1>Opportunities Hub</h1>
            <p>
              Career openings, cadet internships, technical workshops, and alumni reunions across Kenya Airways.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Post an opportunity card */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-[#dce0e3] rounded-xl p-6 shadow-sm sticky top-24"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#dce0e3]">
                <span className="p-2 bg-[#f9e9eb] text-[#bb162b] rounded-lg">
                  <Icon name="opportunity" size={16} />
                </span>
                <div>
                  <h2 className="font-bold text-[#0e2740] text-sm">Post an Opportunity</h2>
                  <p className="text-gray-500 text-xs">Share an opening with verified stakeholders</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    name="title"
                    placeholder="e.g. Graduate Trainee Flight Dispatcher"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Details about requirements, station location, and how to apply..."
                    value={form.description}
                    onChange={handleChange}
                    className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] transition"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Opportunity Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] transition"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {postError && (
                  <p className="text-[#bb162b] text-xs bg-red-50 p-2 rounded">
                    {postError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={posting}
                  className="w-full"
                  icon="arrow"
                >
                  {posting ? "Publishing..." : "Publish Opportunity"}
                </Button>
              </div>
            </form>
          </div>

          {/* List of Opportunities */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#dce0e3]">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Active Listings ({opportunities.length})
              </span>
            </div>

            {error ? (
              <p className="text-red-600 text-sm">{error}</p>
            ) : opportunities.length === 0 ? (
              <div className="p-12 text-center bg-white border border-[#dce0e3] rounded-xl text-gray-500">
                No opportunities posted yet. Be the first to share an opening!
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities.map((o) => (
                  <article
                    key={o.id}
                    className="bg-white border border-[#dce0e3] rounded-xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-base text-[#0e2740]">{o.title}</h3>
                        <span className="text-xs text-gray-400">
                          Shared by {o.postedBy?.profile?.fullName || "Kenya Airways Member"}
                        </span>
                      </div>
                      <Tag gold={o.type.includes("Career")}>{o.type}</Tag>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed mt-2 whitespace-pre-wrap">
                      {o.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#dce0e3] flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 text-[#1b8755] font-semibold">
                        <Icon name="check" size={13} /> Verified Community Post
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </KQAppShell>
  );
}
