"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Tag, Avatar } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import RequestActions from "@/components/RequestActions";

const ROLE_LABELS = {
  ALUMNI: "Pride Centre Alumni",
  STAFF: "Active KQ Staff",
  FORMER_STAFF: "Former KQ Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "Administrator",
};

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "STAFF", label: "Active Staff & Flight Crew" },
  { value: "ALUMNI", label: "Pride Centre Alumni" },
  { value: "FORMER_STAFF", label: "Former Employees" },
  { value: "FREQUENT_FLYER", label: "Asante Frequent Flyers" },
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
      .then(setMeta)
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      const params = new URLSearchParams();
      if (filters.role) params.set("role", filters.role);
      if (filters.skill) params.set("skill", filters.skill);
      if (filters.interest) params.set("interest", filters.interest);
      if (filters.q) params.set("q", filters.q);

      try {
        const res = await fetch(`/api/directory?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load directory");
          setLoading(false);
          return;
        }

        setProfiles(data.profiles || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    load();
  }, [status, filters]);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="app-page">
          <div className="p-12 text-center text-gray-500 font-medium">
            <Icon name="directory" size={28} className="mx-auto mb-3 text-[#bb162b] animate-spin" />
            Loading Kenya Airways stakeholder directory...
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
            <div className="eyebrow">GLOBAL COMMUNITY</div>
            <h1>Stakeholder Directory</h1>
            <p>Browse verified Kenya Airways mentors, alumni, active crew, and industry leaders.</p>
          </div>
          <Button icon="sparkles" onClick={() => router.push("/recommendations")}>
            View AI Matches
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="toolbar flex-wrap">
          <label>
            <Icon name="search" />
            <input
              placeholder="Search by name, department, or keyword..."
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
            />
          </label>

          <select
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.skill}
            onChange={(e) => handleFilterChange("skill", e.target.value)}
          >
            <option value="">All Skills</option>
            {(meta.skills || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filters.interest}
            onChange={(e) => handleFilterChange("interest", e.target.value)}
          >
            <option value="">All Aviation Interests</option>
            {(meta.interests || []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        {/* Results Bar */}
        <div className="results-bar">
          <span>
            <b>{profiles.length} verified stakeholders</b> found
          </span>
          <span>
            Sorted by <b>Name (A–Z)</b> <Icon name="chevron" size={14} />
          </span>
        </div>

        {/* Profiles Grid */}
        {profiles.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#dce0e3] rounded-lg text-gray-500">
            No stakeholders match your filter criteria. Try resetting filters.
          </div>
        ) : (
          <div className="matches-grid">
            {profiles.map((p) => (
              <article className="match-card" key={p.userId}>
                <div className="p-5 flex items-start gap-4 border-b border-[#dce0e3] bg-white">
                  <Avatar name={p.fullName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#bb162b] uppercase tracking-wider block">
                      {ROLE_LABELS[p.role] || p.role}
                    </span>
                    <h3 className="text-lg font-bold text-[#0e2740] truncate">
                      {p.fullName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {p.department || "Kenya Airways Member"}
                    </p>
                  </div>
                </div>

                <div className="match-content">
                  {p.bio && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                      &quot;{p.bio}&quot;
                    </p>
                  )}

                  <div className="tags mb-3">
                    {(p.skills || []).slice(0, 3).map((skill) => (
                      <Tag key={skill}>{skill}</Tag>
                    ))}
                    {(p.interests || []).slice(0, 2).map((interest) => (
                      <Tag key={interest} gold>
                        {interest}
                      </Tag>
                    ))}
                  </div>

                  <div className="mt-auto pt-3 border-t border-[#dce0e3]">
                    <RequestActions
                      receiverId={p.userId}
                      mentorshipRole={p.mentorshipRole}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </KQAppShell>
  );
}
