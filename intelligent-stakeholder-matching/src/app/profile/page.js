"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ROLE_OPTIONS = [
  { value: "", label: "Not participating in mentorship" },
  { value: "MENTOR", label: "Mentor" },
  { value: "MENTEE", label: "Mentee" },
  { value: "BOTH", label: "Both" },
];

export default function ProfilePage() {
  const { status } = useSession();
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

    setMessage("Profile saved.");
  };

  if (status === "loading" || loading) {
    return <div className="max-w-2xl mx-auto mt-16 p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Professional background
          </label>
          <textarea
            name="professionalBackground"
            value={form.professionalBackground}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Training history
          </label>
          <textarea
            name="trainingHistory"
            value={form.trainingHistory}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Career goals
          </label>
          <textarea
            name="careerGoals"
            value={form.careerGoals}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Mentorship role
          </label>
          <select
            name="mentorshipRole"
            value={form.mentorshipRole}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Mentorship needs (if seeking a mentor)
          </label>
          <textarea
            name="mentorshipNeeds"
            value={form.mentorshipNeeds}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Availability
          </label>
          <input
            name="availability"
            placeholder="e.g. Weekday evenings"
            value={form.availability}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Skills</label>
          <div className="flex flex-wrap gap-2">
            {meta.skills.map((skill) => (
              <label
                key={skill.id}
                className={`text-sm border rounded-full px-3 py-1 cursor-pointer select-none ${
                  form.skillIds.includes(skill.id)
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.skillIds.includes(skill.id)}
                  onChange={() => toggleId("skillIds", skill.id)}
                />
                {skill.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Interests</label>
          <div className="flex flex-wrap gap-2">
            {meta.interests.map((interest) => (
              <label
                key={interest.id}
                className={`text-sm border rounded-full px-3 py-1 cursor-pointer select-none ${
                  form.interestIds.includes(interest.id)
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.interestIds.includes(interest.id)}
                  onChange={() => toggleId("interestIds", interest.id)}
                />
                {interest.name}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPublic: e.target.checked }))
            }
          />
          Make my profile visible in the member directory
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-700 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50 w-fit"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
