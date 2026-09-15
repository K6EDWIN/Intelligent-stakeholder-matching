"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ROLE_LABELS = {
  ALUMNI: "Alumni",
  STAFF: "Current Staff",
  FORMER_STAFF: "Former Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "Administrator",
};

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "STAFF", label: "Current Staff" },
  { value: "FORMER_STAFF", label: "Former Employee" },
  { value: "FREQUENT_FLYER", label: "Frequent Flyer" },
];

export default function DirectoryPage() {
  const { status } = useSession();
  const router = useRouter();

  const [meta, setMeta] = useState({ skills: [], interests: [] });
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    skill: "",
    interest: "",
    q: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/meta")
      .then((res) => res.json())
      .then(setMeta);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      const params = new URLSearchParams();
      if (filters.role) params.set("role", filters.role);
      if (filters.skill) params.set("skill", filters.skill);
      if (filters.interest) params.set("interest", filters.interest);
      if (filters.q) params.set("q", filters.q);

      const res = await fetch(`/api/directory?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not load the directory");
        setLoading(false);
        return;
      }

      setError("");
      setProfiles(data.profiles);
      setLoading(false);
    }

    load();
  }, [status, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
  };

  if (status === "loading") {
    return <div className="max-w-4xl mx-auto mt-16 p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-2">Member Directory</h1>
      <p className="text-gray-500 text-sm mb-6">
        Browse and search public stakeholder profiles by role, skill, or
        interest.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          name="q"
          value={filters.q}
          onChange={handleFilterChange}
          placeholder="Search name, department, bio..."
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
        />
        <select
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
          className="border rounded px-3 py-2"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          name="skill"
          value={filters.skill}
          onChange={handleFilterChange}
          className="border rounded px-3 py-2"
        >
          <option value="">All skills</option>
          {meta.skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="interest"
          value={filters.interest}
          onChange={handleFilterChange}
          className="border rounded px-3 py-2"
        >
          <option value="">All interests</option>
          {meta.interests.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : profiles.length === 0 ? (
        <p className="text-gray-500">No profiles match these filters.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {profiles.map((p) => (
            <div key={p.userId} className="border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{p.fullName}</p>
                <span className="text-xs text-gray-500">
                  {ROLE_LABELS[p.role] || p.role}
                </span>
              </div>
              {p.department && (
                <p className="text-sm text-gray-600">{p.department}</p>
              )}
              {p.bio && <p className="text-sm text-gray-700 mt-1">{p.bio}</p>}
              {p.mentorshipRole && (
                <span className="inline-block mt-1 text-xs bg-gray-100 rounded-full px-2 py-0.5">
                  {p.mentorshipRole === "BOTH"
                    ? "Mentor & Mentee"
                    : p.mentorshipRole === "MENTOR"
                    ? "Mentor"
                    : "Mentee"}
                </span>
              )}
              {(p.skills.length > 0 || p.interests.length > 0) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.skills.map((s) => (
                    <span
                      key={`skill-${s}`}
                      className="text-xs bg-black text-white rounded-full px-2 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                  {p.interests.map((i) => (
                    <span
                      key={`interest-${i}`}
                      className="text-xs border border-gray-300 rounded-full px-2 py-0.5"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
