"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Tag, Avatar } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

const ROLE_LABELS = {
  ALUMNI: "Pride Centre Alumni",
  STAFF: "Active KQ Staff",
  FORMER_STAFF: "Former KQ Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "System Administrator",
};

const TEMPLATE_MESSAGES = [
  {
    title: "Career Mentorship",
    text: "Hello, I noticed our shared background and skills on Kenya Airways PrideConnect. I would value your guidance and experience as I navigate my career progression in aviation.",
  },
  {
    title: "Fleet & Operational Exchange",
    text: "Greetings. I noticed our mutual focus on flight deck operations and type ratings. I would appreciate the opportunity to connect and exchange technical insights.",
  },
  {
    title: "Pride Centre Alumni Networking",
    text: "Hello! As fellow members of the Kenya Airways Pride Centre ecosystem, I would like to connect for professional collaboration and knowledge sharing.",
  },
];

export default function RecommendationsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();

  const [recommendations, setRecommendations] = useState([]);
  const [meta, setMeta] = useState({
    totalInteractions: 0,
    model: { active: false, trainingExamples: 0, confidence: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  // A new member may not have enough profile or network history to score
  // above 60% yet. Start broad so cold-start recommendations remain visible.
  const [minScore, setMinScore] = useState(0);
  const [mentorshipFilter, setMentorshipFilter] = useState("ALL");

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      try {
        const res = await fetch("/api/recommendations");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load recommendations");
          setLoading(false);
          return;
        }

        setRecommendations(data.recommendations || []);
        if (data.meta) {
          setMeta(data.meta);
        }
        setLoading(false);
      } catch (err) {
        setError("Network error while loading recommendations: " + err.message);
        setLoading(false);
      }
    }

    load();
  }, [status]);

  const filteredMatches = useMemo(() => {
    return recommendations.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sharedSkills?.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesMinScore = (item.matchPercent || 0) >= minScore;
      const matchesMentorship =
        mentorshipFilter === "ALL" ||
        (mentorshipFilter === "MENTOR" && (item.mentorshipRole === "MENTOR" || item.mentorshipRole === "BOTH")) ||
        (mentorshipFilter === "MENTEE" && (item.mentorshipRole === "MENTEE" || item.mentorshipRole === "BOTH"));

      return matchesSearch && matchesRole && matchesMinScore && matchesMentorship;
    });
  }, [recommendations, searchQuery, roleFilter, minScore, mentorshipFilter]);

  const handleSendRequest = async (receiverId) => {
    const targetId = receiverId || selectedMatch?.userId || selectedMatch?.id;
    if (!targetId) {
      alert("Recipient ID is missing. Please select a valid profile.");
      return;
    }

    setSendingRequest(true);
    setFeedbackSuccess("");
    try {
      const res = await fetch("/api/mentorship-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: targetId,
          userId: targetId,
          message:
            requestMessage ||
            "Hello, I would value connecting with you on Kenya Airways PrideConnect for structured mentorship and professional networking.",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to send request");
      } else {
        setFeedbackSuccess("Mentorship request successfully sent!");
        setTimeout(() => {
          setSelectedMatch(null);
          setRequestMessage("");
          setFeedbackSuccess("");
        }, 1600);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSendingRequest(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 text-[#0e2740] flex items-center justify-center">
            <Icon name="sparkles" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Loading Recommended Matches...
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Evaluating profile skills, fleet specialization, and interaction graph patterns across Kenya Airways stakeholders.
          </p>
        </div>
      </KQAppShell>
    );
  }

  if (error === "Profile not found") {
    return (
      <KQAppShell>
        <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-[#c8102e] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="profile" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            To match you with Kenya Airways mentors and peers, the recommendation system requires your aviation domain, technical competencies, and mentorship goals.
          </p>
          <Button onClick={() => router.push("/profile")}>Complete Profile Now</Button>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="app-page space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-[#0e2740] px-6 py-7 text-white shadow-lg sm:px-8 sm:py-8">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[#c8102e]/20 blur-2xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f6c453]">
                <span className="size-2 rounded-full bg-[#f6c453]" />
                Kenya Airways PrideConnect
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
                Discover people, ideas, and opportunities that can move your aviation journey forward.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => router.push("/profile")} className="btn btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
                <Icon name="profile" size={14} /> Improve profile
              </button>
              <button type="button" onClick={() => router.push("/directory")} className="btn btn-primary">
                <Icon name="search" size={14} /> Browse directory
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "People to explore", value: recommendations.length, href: "#matches", icon: "users" },
            { label: "Strong matches", value: recommendations.filter((item) => item.matchPercent >= 75).length, href: "#matches", icon: "sparkles" },
            { label: "Your next step", value: "Connect", href: "/requests", icon: "requests" },
          ].map((stat) => (
            <a key={stat.label} href={stat.href} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#fef2f2] text-[#c8102e]"><Icon name={stat.icon} size={17} /></span>
              <span><b className="block text-lg font-bold text-slate-900">{stat.value}</b><span className="text-xs text-slate-500">{stat.label}</span></span>
            </a>
          ))}
        </div>

        {/* Header with Enterprise Telemetry */}
        <div id="matches" className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Recommended connections</h2>
            <p className="mt-1 text-sm text-slate-500">Matches shaped by skills, shared experience, and community interactions.</p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
            <div className="border-r border-slate-200 pr-3">
              <span className="block text-[11px] font-semibold uppercase text-slate-400">Engine</span>
              <span className="font-semibold text-slate-800">{meta.model?.provider === "HOSTED_API" ? "Adaptive ML" : meta.model?.active ? "Adaptive ML" : "Learning"}</span>
            </div>
            <div className="border-r border-slate-200 pr-3 font-mono">
              <span className="block text-[11px] font-semibold uppercase text-slate-400">Influence</span>
              <span className="text-slate-700"><b>{meta.model?.confidence || 0}%</b></span>
            </div>
            <div><span className="block text-[11px] font-semibold uppercase text-slate-400">Examples</span><span className="font-semibold text-slate-700">{meta.model?.trainingExamples || 0}</span></div>
          </div>
        </div>

        {recommendations.length > 0 && recommendations.every((item) => item.matchPercent === 0) && (
          <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">Showing people to explore while we learn what fits you</p>
              <p className="mt-1 text-amber-900">Add or update your skills, interests, and mentorship goals to give the recommender more signals for personal matches.</p>
            </div>
            <Button onClick={() => router.push("/profile")} className="shrink-0">Improve my profile</Button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Icon
                name="search"
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                placeholder="Search by stakeholder name, skill, or fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#c8102e] focus:bg-white transition text-slate-800"
              />
            </div>

            {/* Role Filter */}
            <div className="lg:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#c8102e] text-slate-700"
              >
                <option value="ALL">All Stakeholder Roles</option>
                <option value="STAFF">Active KQ Staff</option>
                <option value="ALUMNI">Pride Centre Alumni</option>
                <option value="FORMER_STAFF">Former Employees</option>
                <option value="FREQUENT_FLYER">Frequent Flyers</option>
              </select>
            </div>

            {/* Mentorship Filter */}
            <div className="lg:col-span-2">
              <select
                value={mentorshipFilter}
                onChange={(e) => setMentorshipFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#c8102e] text-slate-700"
              >
                <option value="ALL">All Availability</option>
                <option value="MENTOR">Available Mentors</option>
                <option value="MENTEE">Seeking Mentorship</option>
              </select>
            </div>

            {/* Score Slider */}
            <div className="lg:col-span-2 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Min Match:</span>
                <span className="text-[#c8102e] font-bold">{minScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-[#c8102e] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <b>{filteredMatches.length}</b> matches meeting criteria
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setMinScore(0);
                setMentorshipFilter("ALL");
              }}
              className="text-[#c8102e] font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Matches Grid */}
        {filteredMatches.length === 0 ? (
          <div className="card p-12 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Icon name="search" size={22} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Stakeholders Match These Filters</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Try a broader search or reset your filters to see more people in the network.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMatches.map((item) => {
              const roleDisplay = ROLE_LABELS[item.role] || item.role;
              const isHighMatch = item.matchPercent >= 85;

              return (
                <article
                  key={item.userId}
                  className="card p-6 sm:p-7 flex flex-col justify-between space-y-5"
                >
                  <div>
                    {/* Header: Role Tag + Match Score */}
                    <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {roleDisplay}
                      </span>
                      <div
                        className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                          isHighMatch
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-800 border border-slate-200"
                        }`}
                      >
                        <span>{item.matchPercent === 0 ? "New suggestion" : `${item.matchPercent}% Match`}</span>
                      </div>
                    </div>

                    {/* Member Profile Info */}
                    <div className="flex items-start gap-4 mt-4">
                      <Avatar name={item.fullName} size="lg" role={item.role} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {item.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.department || "Kenya Airways Aviation Specialist"}
                        </p>
                        <span className="inline-block mt-1 text-xs font-medium text-[#c8102e]">
                          {item.mentorshipRole === "MENTOR"
                            ? "Available Mentor"
                            : item.mentorshipRole === "MENTEE"
                            ? "Seeking Mentorship"
                            : "Mentorship & Networking"}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="mt-4 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Predicted request acceptance:</span>
                        <b className="font-mono text-slate-900">{item.mlAcceptanceProbability == null ? "Gathering examples" : `${item.mlAcceptanceProbability}%`}</b>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#c8102e] h-full rounded-full"
                          style={{ width: `${item.mlAcceptanceProbability ?? 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-slate-600 pt-1">
                        <span>Profile &amp; skills similarity:</span>
                        <b className="font-mono text-slate-900">{item.contentScore}%</b>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0e2740] h-full rounded-full"
                          style={{ width: `${item.contentScore}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1">
                        <span>Community network signal:</span>
                        <b className="font-mono text-slate-900">{item.collaborativeScore}%</b>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${item.collaborativeScore}%` }}
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-200/70">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Model signals · {item.mlInfluence ?? 0}% ranking influence</div>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                          {[
                            `Skills ${item.signals?.skillOverlap ?? 0}%`,
                            `Interests ${item.signals?.interestOverlap ?? 0}%`,
                            `Department ${item.signals?.sameDepartment ? "match" : "no match"}`,
                            `Role fit ${item.signals?.mentorshipRoleFit ? "yes" : "no"}`,
                            `Network ${item.signals?.sharedNetwork ?? 0}%`,
                            item.signals?.requestType || "Mentorship",
                          ].map((signal) => <span key={signal} className="px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">{signal}</span>)}
                        </div>
                      </div>
                      {!meta.model?.active && (
                        <p className="pt-1 text-[11px] text-slate-500">
                          The model is collecting resolved request outcomes. Predictions will become personalized as members accept or decline requests.
                        </p>
                      )}
                    </div>

                    {/* Shared Skills Chips */}
                    <div className="mt-4">
                      <div className="text-[11px] uppercase font-semibold text-slate-400 mb-2 tracking-wider">
                        Shared Competencies
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(item.sharedSkills || []).slice(0, 4).map((skill) => (
                          <Tag key={skill}>{skill}</Tag>
                        ))}
                        {(!item.sharedSkills || item.sharedSkills.length === 0) && item.matchPercent > 0 && <Tag>Aviation Specialist</Tag>}
                        {(!item.sharedSkills || item.sharedSkills.length === 0) && item.matchPercent === 0 && <span className="text-xs text-slate-500">No shared skills yet</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatch(item);
                        setRequestMessage(TEMPLATE_MESSAGES[0].text);
                      }}
                      className="btn btn-primary text-xs py-2.5 flex-1 rounded-lg"
                    >
                      <Icon name="requests" size={14} />
                      <span>Request Mentorship</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(item)}
                      className="btn btn-secondary text-xs py-2.5 px-3.5 rounded-lg"
                      title="View Details"
                    >
                      <Icon name="eye" size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Mentorship Request Modal */}
        {selectedMatch && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedMatch(null)}
          >
            <div
              className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <Icon name="close" size={16} />
              </button>

              {/* Profile Overview */}
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <Avatar name={selectedMatch.fullName} size="lg" role={selectedMatch.role} />
                <div>
                  <span className="text-xs font-semibold text-[#c8102e]">
                    {ROLE_LABELS[selectedMatch.role] || selectedMatch.role}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedMatch.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedMatch.department || "Kenya Airways Aviation Specialist"}
                  </p>
                </div>
              </div>

              {/* Bio summary */}
              {selectedMatch.bio && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <b className="text-slate-800">Background:</b> {selectedMatch.bio}
                </div>
              )}

              {/* Feedback Success Alert */}
              {feedbackSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{feedbackSuccess}</span>
                </div>
              )}

              {/* Message Composer */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mentorship Request Message
                </label>

                {/* Template Quick-Select Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_MESSAGES.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRequestMessage(t.text)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Introduce yourself, share your current role or aviation aspirations..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm outline-none focus:bg-white focus:border-[#c8102e] transition resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  onClick={() => handleSendRequest(selectedMatch.userId)}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? "Sending Request..." : "Send Request"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KQAppShell>
  );
}
