"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KQAppShell from "@/components/KQAppShell";
import { Button, Avatar, Tag } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

const ROLE_LABELS = {
  ALUMNI: "Pride Centre Alumni",
  STAFF: "Active KQ Staff",
  FORMER_STAFF: "Former KQ Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "Administrator",
};

export default function RequestsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("pending"); // pending, sent, active
  const [mentorship, setMentorship] = useState({ sent: [], received: [] });
  const [connections, setConnections] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);

  // Rating & Feedback State
  const [ratingTarget, setRatingTarget] = useState(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const refreshRequests = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/mentorship-requests"),
        fetch("/api/connection-requests"),
      ]);

      const mData = await mRes.json();
      const cData = await cRes.json();

      if (mRes.ok) setMentorship(mData);
      if (cRes.ok) setConnections(cData);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    let isCurrent = true;

    Promise.all([
      fetch("/api/mentorship-requests"),
      fetch("/api/connection-requests"),
    ])
      .then(async ([mRes, cRes]) => {
        const mData = await mRes.json();
        const cData = await cRes.json();
        if (!isCurrent) return;
        if (mRes.ok) setMentorship(mData);
        if (cRes.ok) setConnections(cData);
        setLoading(false);
      })
      .catch(() => {
        if (!isCurrent) return;
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [status]);

  const handleRespond = async (kind, id, newStatus) => {
    const endpoint =
      kind === "mentorship"
        ? `/api/mentorship-requests/${id}`
        : `/api/connection-requests/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (newStatus === "ACCEPTED") {
          setRatingTarget({ id, kind, role: "Partner" });
        }
        refreshRequests();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to respond");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleRateSubmit = async () => {
    if (!ratingTarget) return;
    setSubmittingFeedback(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorshipRequestId: ratingTarget.kind === "mentorship" ? ratingTarget.id : null,
          rating: selectedStars,
          comment: feedbackComment || null,
        }),
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setRatingTarget(null);
          setFeedbackSuccess(false);
          setFeedbackComment("");
        }, 1800);
      } else {
        const data = await res.json();
        alert(data.error || "Could not save rating");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const pendingList = useMemo(() => {
    const m = (mentorship.received || [])
      .filter((r) => r.status === "PENDING")
      .map((r) => ({ ...r, kind: "mentorship" }));
    const c = (connections.received || [])
      .filter((r) => r.status === "PENDING")
      .map((r) => ({ ...r, kind: "connection" }));
    return [...m, ...c];
  }, [mentorship, connections]);

  const sentList = useMemo(() => {
    const m = (mentorship.sent || []).map((r) => ({ ...r, kind: "mentorship" }));
    const c = (connections.sent || []).map((r) => ({ ...r, kind: "connection" }));
    return [...m, ...c];
  }, [mentorship, connections]);

  const activeConnectionsList = useMemo(() => {
    const mRec = (mentorship.received || [])
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => ({ ...r, kind: "mentorship", isReceived: true }));
    const mSent = (mentorship.sent || [])
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => ({ ...r, kind: "mentorship", isReceived: false }));
    const cRec = (connections.received || [])
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => ({ ...r, kind: "connection", isReceived: true }));
    const cSent = (connections.sent || [])
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => ({ ...r, kind: "connection", isReceived: false }));
    return [...mRec, ...mSent, ...cRec, ...cSent];
  }, [mentorship, connections]);

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#bb162b]/10 text-[#bb162b] flex items-center justify-center animate-pulse">
            <Icon name="requests" size={32} />
          </div>
          <h2 className="text-xl font-bold font-['Fraunces',serif] text-[#0e2740]">
            Loading Your Network Requests...
          </h2>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dce0e3]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bb162b]/10 text-[#bb162b] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Icon name="requests" size={13} />
              Mentorship &amp; Connections Hub
            </div>
            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-normal text-[#0e2740]">
              Network Requests
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
              Manage bilateral connection requests and track ongoing mentorship engagements across the Kenya Airways community.
            </p>
          </div>

          <Button icon="directory" onClick={() => router.push("/directory")}>
            Explore Directory
          </Button>
        </div>

        {/* Tab Pills */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#dce0e3] shadow-sm max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "pending"
                ? "bg-[#bb162b] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Pending</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "pending" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {pendingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "sent"
                ? "bg-[#bb162b] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Sent</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "sent" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {sentList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "active"
                ? "bg-[#bb162b] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Active</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "active" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {activeConnectionsList.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Pending Received Requests */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingList.length === 0 ? (
              <div className="p-16 text-center bg-white border border-[#dce0e3] rounded-3xl shadow-sm text-gray-500 space-y-2">
                <Icon name="check" size={32} className="mx-auto text-[#1b8755]" />
                <h3 className="font-bold text-gray-800 text-base">You are all caught up!</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No incoming mentorship requests pending your review at this time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pendingList.map((req) => {
                  const counterpart = req.sender;
                  const name = counterpart?.profile?.fullName || "Kenya Airways Member";
                  const role = ROLE_LABELS[counterpart?.role] || counterpart?.role || "Stakeholder";

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#dce0e3] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-gray-400 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fbf9f5] border border-gray-200 text-gray-600 uppercase tracking-wider">
                            {role}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <Avatar name={name} size="md" />
                          <div>
                            <h3 className="font-['Fraunces',serif] text-base font-bold text-[#0e2740]">
                              {name}
                            </h3>
                            <span className="text-xs text-[#bb162b] font-medium">
                              {req.kind === "mentorship" ? "Mentorship Proposal" : "Networking Request"}
                            </span>
                          </div>
                        </div>

                        {req.message && (
                          <div className="p-3 bg-[#fbf9f5] rounded-xl border border-gray-200 text-xs text-gray-700 italic leading-relaxed">
                            &ldquo;{req.message}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleRespond(req.kind, req.id, "ACCEPTED")}
                          className="flex-1 btn btn-primary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Icon name="check" size={14} />
                          <span>Accept Request</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.kind, req.id, "DECLINED")}
                          className="btn btn-secondary text-xs py-2 px-4 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sent Requests */}
        {activeTab === "sent" && (
          <div className="space-y-4">
            {sentList.length === 0 ? (
              <div className="p-16 text-center bg-white border border-[#dce0e3] rounded-3xl shadow-sm text-gray-500 space-y-2">
                <Icon name="requests" size={32} className="mx-auto text-gray-400" />
                <h3 className="font-bold text-gray-800 text-base">No Sent Requests</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Browse AI recommendations or the Member Directory to send your first connection invitation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {sentList.map((req) => {
                  const counterpart = req.receiver;
                  const name = counterpart?.profile?.fullName || "Kenya Airways Member";
                  const role = ROLE_LABELS[counterpart?.role] || counterpart?.role || "Stakeholder";

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#dce0e3] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fbf9f5] border border-gray-200 text-gray-600 uppercase tracking-wider">
                            {role}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              req.status === "ACCEPTED"
                                ? "bg-emerald-50 text-[#1b8755] border border-emerald-200"
                                : req.status === "DECLINED"
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <Avatar name={name} size="md" />
                          <div>
                            <h3 className="font-['Fraunces',serif] text-base font-bold text-[#0e2740]">
                              {name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              Sent on {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {req.message && (
                          <div className="p-3 bg-[#fbf9f5] rounded-xl border border-gray-200 text-xs text-gray-700 italic leading-relaxed">
                            &ldquo;{req.message}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Active Connections & Rating Feedback */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeConnectionsList.length === 0 ? (
              <div className="p-16 text-center bg-white border border-[#dce0e3] rounded-3xl shadow-sm text-gray-500 space-y-2">
                <Icon name="users" size={32} className="mx-auto text-gray-400" />
                <h3 className="font-bold text-gray-800 text-base">No Active Mentorship Pairs Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When a request is accepted, your bilateral connection will appear here with collaborative milestones.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeConnectionsList.map((req) => {
                  const counterpart = req.isReceived ? req.sender : req.receiver;
                  const name = counterpart?.profile?.fullName || "Kenya Airways Member";
                  const role = ROLE_LABELS[counterpart?.role] || counterpart?.role || "Stakeholder";

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#dce0e3] rounded-2xl p-6 shadow-sm space-y-4 hover:border-gray-400 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fbf9f5] border border-gray-200 text-gray-600 uppercase tracking-wider">
                          {role}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1b8755]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1b8755]" />
                          Active Connection
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <Avatar name={name} size="md" />
                        <div>
                          <h3 className="font-['Fraunces',serif] text-base font-bold text-[#0e2740]">
                            {name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Connected since {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Mentorship Milestones */}
                      <div className="p-3 bg-[#fbf9f5] rounded-xl border border-gray-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-semibold text-gray-700 text-[11px]">
                          <span>Engagement Roadmap:</span>
                          <span className="text-[#1b8755]">Milestone 2 of 4</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#1b8755] h-full rounded-full w-1/2" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                          <span>1. Intro Handshake ✓</span>
                          <span>2. Skill Goals Alignment ✓</span>
                          <span>3. Mid Review</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setRatingTarget({ id: req.id, kind: req.kind, name })}
                          className="flex-1 btn btn-secondary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Icon name="star" size={14} className="text-[#c59b27]" />
                          <span>Rate Mentorship Quality</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rating & Collaborative Feedback Modal */}
        {ratingTarget && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setRatingTarget(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative border border-gray-200 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setRatingTarget(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <Icon name="close" size={18} />
              </button>

              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#c59b27]/10 text-[#c59b27] flex items-center justify-center">
                <Icon name="star" size={30} />
              </div>

              <div>
                <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#0e2740]">
                  Rate This Mentorship Match
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your feedback trains the Collaborative Filtering engine and optimizes recommendation accuracy for all Kenya Airways stakeholders.
                </p>
              </div>

              {feedbackSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-[#1b8755] text-xs font-semibold rounded-2xl flex items-center justify-center gap-2">
                  <Icon name="check" size={18} />
                  <span>Rating Recorded! Collaborative weights updated.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Star Rating Selector */}
                  <div className="flex items-center justify-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedStars(star)}
                        className="p-1 transition hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Icon
                          name="star"
                          size={28}
                          className={
                            star <= selectedStars ? "text-[#c59b27] fill-[#c59b27]" : "text-gray-300"
                          }
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Optional feedback: Did this mentorship meet your professional expectations?"
                    className="w-full p-3 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs outline-none focus:bg-white focus:border-[#bb162b] resize-none"
                  />

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRatingTarget(null)}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                      Skip
                    </button>
                    <Button onClick={handleRateSubmit} disabled={submittingFeedback}>
                      {submittingFeedback ? "Saving..." : "Submit Quality Rating"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </KQAppShell>
  );
}
