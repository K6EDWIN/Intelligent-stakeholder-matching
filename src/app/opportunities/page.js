"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
      const res = await fetch("/api/opportunities");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not load opportunities");
        setLoading(false);
        return;
      }

      setOpportunities(data.opportunities);
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
  };

  if (status === "loading" || loading) {
    return <div className="max-w-2xl mx-auto mt-16 p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Opportunities</h1>
        <p className="text-gray-500 text-sm">
          Career openings, internships, workshops, and alumni reunions
          shared by the community.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 border rounded-lg p-4">
        <h2 className="font-semibold">Post an opportunity</h2>
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
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {postError && <p className="text-red-600 text-sm">{postError}</p>}
        <button
          type="submit"
          disabled={posting}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50 w-fit"
        >
          {posting ? "Posting..." : "Post opportunity"}
        </button>
      </form>

      {error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : opportunities.length === 0 ? (
        <p className="text-gray-500">No opportunities posted yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {opportunities.map((o) => (
            <div key={o.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{o.title}</p>
                <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                  {o.type}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{o.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                Posted by {o.postedBy?.profile?.fullName || "Unknown"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
