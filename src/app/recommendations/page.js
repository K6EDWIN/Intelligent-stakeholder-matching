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
  ADMIN: "Administrator",
};

const TEMPLATE_MESSAGES = [
  {
    title: "Career Mentorship",
    text: "Hello! I saw our shared skills on Kenya Airways PrideConnect. I would value your guidance and experience as I navigate my career progression in aviation.",
  },
  {
    title: "Fleet & Type Rating",
    text: "Greetings. I noticed our mutual focus on flight deck operations and type ratings. I would appreciate the opportunity to connect and exchange insights.",
  },
  {
    title: "Pride Centre Networking",
    text: "Hi! As fellow members of the Kenya Airways Pride Centre ecosystem, I'd love to connect for mutual professional growth and knowledge exchange.",
  },
];

export default function RecommendationsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [recommendations, setRecommendations] = useState([]);
  const [meta, setMeta] = useState({ weights: { alpha: 80, beta: 20 }, totalInteractions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [minScore, setMinScore] = useState(60);
  const [mentorshipFilter, setMentorshipFilter] = useState("ALL");

  // Dialog State
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
        setError("Network error while loading matches: " + err.message);
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
        }, 1800);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#bb162b]/10 text-[#bb162b] flex items-center justify-center animate-pulse">
            <Icon name="sparkles" size={32} />
          </div>
          <h2 className="text-xl font-bold font-['Fraunces',serif] text-[#0e2740]">
            Computing Hybrid AI Recommendations...
          </h2>
          <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
            Evaluating Content-Based vector cosine similarities and collaborative interaction patterns across Kenya Airways stakeholders.
          </p>
        </div>
      </KQAppShell>
    );
  }

  if (error === "Profile not found") {
    return (
      <KQAppShell>
        <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-[#dce0e3] rounded-2xl text-center shadow-lg">
          <div className="w-16 h-16 bg-red-50 text-[#bb162b] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="profile" size={30} />
          </div>
          <h2 className="text-2xl font-bold font-['Fraunces',serif] text-[#0e2740] mb-2">
            Complete Your Profile First
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-6 leading-relaxed">
            To match you with Kenya Airways mentors and peers, our hybrid recommendation engine requires your aviation skills, fleet ratings, and career goals.
          </p>
          <Button onClick={() => router.push("/profile")}>Set Up Profile Now</Button>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Algorithmic Telemetry */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#dce0e3]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bb162b]/10 text-[#bb162b] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Icon name="sparkles" size={13} />
              Hybrid Recommendation Engine
            </div>
            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-normal text-[#0e2740]">
              AI Stakeholder Matches
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Precision rankings fusing Content-Based cosine similarity (skills &amp; aircraft taxonomy) with collaborative community feedback.
            </p>
          </div>

          {/* Engine Parameters Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-[#dce0e3] shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b8755] animate-ping" />
              <b className="text-gray-800">Dynamic Weights:</b>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-gray-600">
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                α (CBF): <b>{meta.weights?.alpha || 85}%</b>
              </span>
              <span>+</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                β (CF): <b>{meta.weights?.beta || 15}%</b>
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              ({meta.totalInteractions || 0} accepted interactions)
            </span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-[#dce0e3] shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Icon
                name="search"
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                placeholder="Search by stakeholder name, skill, or fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm outline-none focus:border-[#bb162b] focus:bg-white transition"
              />
            </div>

            {/* Role Filter */}
            <div className="lg:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm outline-none focus:border-[#bb162b] text-gray-700"
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
                className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm outline-none focus:border-[#bb162b] text-gray-700"
              >
                <option value="ALL">All Availability</option>
                <option value="MENTOR">Available Mentors</option>
                <option value="MENTEE">Seeking Mentorship</option>
              </select>
            </div>

            {/* Score Slider */}
            <div className="lg:col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                <span>Min Match:</span>
                <span className="text-[#bb162b] font-bold">{minScore}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-[#bb162b] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing <b>{filteredMatches.length}</b> matches meeting your algorithmic thresholds
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setMinScore(60);
                setMentorshipFilter("ALL");
              }}
              className="text-[#bb162b] font-semibold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Matches Grid */}
        {filteredMatches.length === 0 ? (
          <div className="p-16 text-center bg-white border border-[#dce0e3] rounded-2xl shadow-sm text-gray-500 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              <Icon name="search" size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-base">No Matching Stakeholders Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Try adjusting the minimum match slider or search query to broaden your network discovery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((item) => {
              const roleDisplay = ROLE_LABELS[item.role] || item.role;
              const isHighMatch = item.matchPercent >= 90;

              return (
                <article
                  key={item.userId}
                  className="bg-white border border-[#dce0e3] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-400 transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header: Role Badge + Match Score Pill */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fbf9f5] border border-gray-200 text-gray-600 uppercase tracking-wider">
                        {roleDisplay}
                      </span>
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm ${
                          isHighMatch
                            ? "bg-[#1b8755] text-white"
                            : item.matchPercent >= 80
                            ? "bg-[#c59b27] text-white"
                            : "bg-[#0e2740] text-white"
                        }`}
                      >
                        <Icon name="sparkles" size={13} />
                        <span>{item.matchPercent}% Match</span>
                      </div>
                    </div>

                    {/* Member Profile Info */}
                    <div className="flex items-start gap-3 mt-4">
                      <Avatar name={item.fullName} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-['Fraunces',serif] text-lg font-bold text-[#0e2740] truncate">
                          {item.fullName}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {item.department || "Kenya Airways Aviation Specialist"}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-[#bb162b] uppercase tracking-wider">
                          {item.mentorshipRole === "MENTOR"
                            ? "Available to Mentor"
                            : item.mentorshipRole === "MENTEE"
                            ? "Seeking Mentorship"
                            : "Open to Mentoring & Networking"}
                        </span>
                      </div>
                    </div>

                    {/* Explainable Score Breakdown Accordion */}
                    <div className="mt-4 p-3 bg-[#fbf9f5] border border-[#e2e6e9] rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-gray-600">
                        <span className="flex items-center gap-1 font-medium">
                          <Icon name="profile" size={12} className="text-[#bb162b]" />
                          Profile Vector Similarity (CBF):
                        </span>
                        <b className="font-mono text-gray-900">{item.contentScore || item.matchPercent}%</b>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#bb162b] h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.contentScore || item.matchPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Icon name="users" size={12} className="text-[#1b8755]" />
                          Community Interaction (CF):
                        </span>
                        <b className="font-mono text-gray-900">{item.collaborativeScore || 70}%</b>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#1b8755] h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.collaborativeScore || 70}%` }}
                        />
                      </div>
                    </div>

                    {/* Shared Skills Chips */}
                    <div className="mt-3">
                      <div className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 tracking-wider">
                        Shared Competencies
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(item.sharedSkills || []).slice(0, 3).map((skill) => (
                          <Tag key={skill}>{skill}</Tag>
                        ))}
                        {(!item.sharedSkills || item.sharedSkills.length === 0) && (
                          <Tag>Aviation Professional</Tag>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMatch(item);
                        setRequestMessage(TEMPLATE_MESSAGES[0].text);
                      }}
                      className="btn btn-primary text-xs py-2 flex-1 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Icon name="requests" size={14} />
                      <span>Request Mentorship</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(item)}
                      className="btn btn-secondary text-xs py-2 px-3 rounded-lg border-gray-300 hover:bg-gray-50"
                      title="Inspect Detailed Profile"
                    >
                      <Icon name="eye" size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Personalized Mentorship Request & Profile Modal */}
        {selectedMatch && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setSelectedMatch(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <Icon name="close" size={18} />
              </button>

              {/* Profile Overview */}
              <div className="flex items-start gap-4">
                <Avatar name={selectedMatch.fullName} size="xl" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bb162b]">
                    {ROLE_LABELS[selectedMatch.role] || selectedMatch.role}
                  </span>
                  <h3 className="font-['Fraunces',serif] text-2xl font-bold text-[#0e2740]">
                    {selectedMatch.fullName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedMatch.department || "Kenya Airways Aviation Specialist"}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#1b8755] border border-emerald-200 text-xs font-bold">
                    <Icon name="sparkles" size={13} />
                    <span>{selectedMatch.matchPercent}% Compatibility Vector</span>
                  </div>
                </div>
              </div>

              {/* Bio summary */}
              {selectedMatch.bio && (
                <div className="p-3 bg-[#fbf9f5] rounded-xl border border-gray-200 text-xs text-gray-600 leading-relaxed">
                  <b>Professional Background:</b> {selectedMatch.bio}
                </div>
              )}

              {/* Feedback Success Alert */}
              {feedbackSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#1b8755] text-xs rounded-xl flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>{feedbackSuccess}</span>
                </div>
              )}

              {/* Message Composer */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Personalized Mentorship Message
                </label>

                {/* Template Quick-Select Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_MESSAGES.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRequestMessage(t.text)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-medium text-gray-700 transition"
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
                  className="w-full p-3 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#bb162b] focus:ring-1 focus:ring-[#bb162b] transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Cancel
                </button>
                <Button
                  onClick={() => handleSendRequest(selectedMatch.userId)}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? "Sending Request..." : "Send Mentorship Request"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </KQAppShell>
  );
}
