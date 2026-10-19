"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Avatar } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

const ROLE_OPTIONS = [
  { value: "", label: "Not participating in mentorship" },
  { value: "MENTOR", label: "Available to Mentor" },
  { value: "MENTEE", label: "Seeking a Mentor" },
  { value: "BOTH", label: "Open to Both (Mentor & Mentee)" },
];

export default function ProfilePage() {
  const { status, data: session } = useSession();
  const router = useRouter();

  const [meta, setMeta] = useState({ skills: [], interests: [] });
  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    department: "",
    professionalBackground: "",
    trainingHistory: "",
    careerGoals: "",
    mentorshipNeeds: "",
    mentorshipRole: "",
    availability: "",
    isPublic: true,
    skillIds: [],
    interestIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      try {
        const [metaRes, profileRes] = await Promise.all([
          fetch("/api/meta"),
          fetch("/api/profile"),
        ]);

        const metaData = await metaRes.json();
        setMeta(metaData);

        if (profileRes.ok) {
          const { profile } = await profileRes.json();
          setForm((f) => ({
            ...f,
            fullName: profile.fullName || "",
            bio: profile.bio || "",
            department: profile.department || "",
            professionalBackground: profile.professionalBackground || "",
            trainingHistory: profile.trainingHistory || "",
            careerGoals: profile.careerGoals || "",
            mentorshipNeeds: profile.mentorshipNeeds || "",
            mentorshipRole: profile.mentorshipRole || "",
            availability: profile.availability || "",
            isPublic: profile.isPublic ?? true,
            skillIds: profile.skillIds || [],
            interestIds: profile.interestIds || [],
          }));
        }

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

  const toggleId = (key, id) => {
    setForm((f) => {
      const current = f[key];
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      return { ...f, [key]: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        setError(data.error || "Failed to save profile");
        return;
      }

      setMessage("Your profile & matching vectors have been updated.");
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="app-page">
          <div className="p-12 text-center text-gray-500 font-medium">
            <Icon name="profile" size={28} className="mx-auto mb-3 text-[#bb162b] animate-spin" />
            Loading your profile data...
          </div>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="app-page max-w-5xl">
        {/* Profile Header */}
        <div className="card overflow-hidden mb-8">
          <div className="h-28 bg-gradient-to-r from-[#071626] via-[#0e2740] to-[#1e3a5f] relative">
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 500 150" fill="none">
                <path d="M10 120 C150 40 350 140 490 20" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 6" />
              </svg>
            </div>
          </div>
          <div className="px-6 sm:px-8 pb-6 pt-0 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 relative z-10">
            <div className="flex items-end gap-4">
              <div className="border-4 border-white rounded-full shadow-sm bg-white">
                <Avatar name={form.fullName || session?.user?.email} size="xl" />
              </div>
              <div className="mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {form.fullName || "Your Profile"}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {form.department || "Kenya Airways Stakeholder"} · {session?.user?.email} · {session?.user?.role === "ADMIN" ? "Administrator" : "Verified Member"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Icon name="shield" size={13} />
                Verified Member
              </span>
            </div>
          </div>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Icon name="check" size={16} />
              <span className="font-medium">{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <Icon name="close" size={16} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Section 1: Core Details */}
          <section className="card p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Icon name="profile" size={16} className="text-[#c8102e]" />
              Personal &amp; Department Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Aviation Department / Unit
                </label>
                <input
                  name="department"
                  placeholder="e.g. Flight Operations, In-flight, Ground Ops, Cargo"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bio / Overview
                </label>
                <textarea
                  name="bio"
                  placeholder="Brief summary of your background, experience at Kenya Airways or Pride Centre..."
                  value={form.bio}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Mentorship Settings */}
          <section className="card p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Icon name="sparkles" size={16} className="text-[#c59b27]" />
              Mentorship Participation &amp; Career Trajectory
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mentorship Role
                </label>
                <select
                  name="mentorshipRole"
                  value={form.mentorshipRole}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mentorship Availability
                </label>
                <input
                  name="availability"
                  placeholder="e.g. 2 hours/month, Flexible, Weekday mornings"
                  value={form.availability}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Career Goals &amp; Objectives
                </label>
                <textarea
                  name="careerGoals"
                  placeholder="What professional milestones are you working towards? (Informs stakeholder matching)"
                  value={form.careerGoals}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                  rows={2}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Mentorship Needs
                </label>
                <textarea
                  name="mentorshipNeeds"
                  placeholder="What areas or skills do you hope to receive guidance on?"
                  value={form.mentorshipNeeds}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] transition"
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Skills & Taxonomy */}
          <section className="card p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Icon name="academic" size={16} className="text-emerald-700" />
              Skills &amp; Interests (Profile Competencies)
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Technical &amp; Operational Skills ({form.skillIds.length} selected)
                </label>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                  {(meta.skills || []).map((skill) => {
                    const isSelected = form.skillIds.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleId("skillIds", skill.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#c8102e] text-white border-[#c8102e] shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Icon name="check" size={12} />}
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Aviation &amp; Professional Interests ({form.interestIds.length} selected)
                </label>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                  {(meta.interests || []).map((interest) => {
                    const isSelected = form.interestIds.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleId("interestIds", interest.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#0e2740] text-white border-[#0e2740] shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {isSelected && <Icon name="check" size={12} />}
                        {interest.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isPublic: e.target.checked }))
                    }
                    className="accent-[#c8102e] rounded"
                  />
                  <span>Make my profile publicly discoverable in the Kenya Airways Stakeholder Directory</span>
                </label>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end pb-8">
            <Button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold shadow-sm"
              icon="arrow"
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </div>
    </KQAppShell>
  );
}
