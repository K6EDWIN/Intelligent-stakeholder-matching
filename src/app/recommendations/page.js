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
  const { status } = useSession();
  const router = useRouter();

  const [recommendations, setRecommendations] = useState([]);
  const [meta, setMeta] = useState({ weights: { alpha: 85, beta: 15 }, totalInteractions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [minScore, setMinScore] = useState(60);
  const [mentorshipFilter, setMentorshipFilter] = useState("ALL");

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
    setSendingRequest(true);
    setFeedbackSuccess("");
    try {
      const res = await fetch("/api/mentorship-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
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
        {/* Header with Enterprise Telemetry */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c8102e] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#c8102e]" />
              Kenya Airways PrideConnect
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Stakeholder Recommendations
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Intelligent matches based on aviation competencies, Pride Centre background, and community interactions.
            </p>
          </div>

          {/* Engine Parameters Badge */}
          <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs">
            <div className="border-r border-slate-200 pr-3">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Algorithm Model</span>
              <span className="font-semibold text-slate-800">Hybrid CBF + CF</span>
            </div>
            <div className="border-r border-slate-200 pr-3 font-mono">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Current Weights</span>
              <span className="text-slate-700">
                α: <b>{meta.weights?.alpha || 85}%</b> · β: <b>{meta.weights?.beta || 15}%</b>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold uppercase">Dataset Interactions</span>
              <span className="font-semibold text-slate-700">{meta.totalInteractions || 0} logged</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Icon
                name="search"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                placeholder="Search by stakeholder name, skill, or fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-[#c8102e] focus:bg-white transition text-slate-800"
              />
            </div>

            {/* Role Filter */}
            <div className="lg:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-[#c8102e] text-slate-700"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-[#c8102e] text-slate-700"
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
                min="40"
                max="95"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-[#c8102e] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <b>{filteredMatches.length}</b> matches meeting criteria
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setMinScore(60);
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
            <h3 className="font-bold text-slate-800 text-base">No Matching Stakeholders Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Try adjusting the minimum match slider or search query to broaden your network discovery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMatches.map((item) => {
              const roleDisplay = ROLE_LABELS[item.role] || item.role;
              const isHighMatch = item.matchPercent >= 85;

              return (
                <article
                  key={item.userId}
                  className="card p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header: Role Tag + Match Score */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {roleDisplay}
                      </span>
                      <div
                        className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 ${
                          isHighMatch
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-800 border border-slate-200"
                        }`}
                      >
                        <span>{item.matchPercent}% Match</span>
                      </div>
                    </div>

                    {/* Member Profile Info */}
                    <div className="flex items-start gap-3 mt-3">
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
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Profile &amp; Skills Similarity:</span>
                        <b className="font-mono text-slate-900">{item.contentScore || item.matchPercent}%</b>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#c8102e] h-full rounded-full"
                          style={{ width: `${item.contentScore || item.matchPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-slate-600 pt-1">
                        <span>Community Interaction Network:</span>
                        <b className="font-mono text-slate-900">{item.collaborativeScore || 60}%</b>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${item.collaborativeScore || 60}%` }}
                        />
                      </div>
                    </div>

                    {/* Shared Skills Chips */}
                    <div className="mt-3">
                      <div className="text-[11px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">
                        Shared Competencies
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(item.sharedSkills || []).slice(0, 3).map((skill) => (
                          <Tag key={skill}>{skill}</Tag>
                        ))}
                        {(!item.sharedSkills || item.sharedSkills.length === 0) && (
                          <Tag>Aviation Specialist</Tag>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatch(item);
                        setRequestMessage(TEMPLATE_MESSAGES[0].text);
                      }}
                      className="btn btn-primary text-xs py-2 flex-1 rounded-md"
                    >
                      <Icon name="requests" size={14} />
                      <span>Request Mentorship</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(item)}
                      className="btn btn-secondary text-xs py-2 px-3 rounded-md"
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
