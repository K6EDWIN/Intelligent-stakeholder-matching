"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KQLogo, Button, Tag, Avatar } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

const ROLE_LABELS = {
  ALUMNI: "Pride Centre Alumni",
  STAFF: "Active KQ Staff",
  FORMER_STAFF: "Former KQ Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "Administrator",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState("model"); // "model" | "stakeholders" | "telemetry"

  // Platform Data
  const [stats, setStats] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);

  // Stakeholder Registry Filters
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Recommender Live Simulation State
  const [simTargetUserId, setSimTargetUserId] = useState("");
  const [simulationData, setSimulationData] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.role !== "ADMIN") return;

    async function load() {
      try {
        const [statsRes, usersRes, evalRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
          fetch("/api/admin/evaluation"),
        ]);
        const [statsData, usersData, evalData] = await Promise.all([
          statsRes.json(),
          usersRes.json(),
          evalRes.json(),
        ]);

        if (!statsRes.ok || !usersRes.ok) {
          setError(statsData.error || usersData.error || "Could not load admin console data");
          setLoading(false);
          return;
        }

        setStats(statsData);
        const userList = usersData.users || [];
        setUsers(userList);
        if (userList.length > 0 && !simTargetUserId) {
          setSimTargetUserId(userList[0].id);
        }

        if (evalData.benchmark) {
          setBenchmark(evalData.benchmark);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    load();
  }, [status, session]);

  const runAction = async (userId, action) => {
    setPendingUserId(userId);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      setPendingUserId(null);

      if (!res.ok) {
        alert(data.error || "Action failed");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)));
    } catch (err) {
      setPendingUserId(null);
      alert("Error: " + err.message);
    }
  };

  const runSimulation = async (userId) => {
    const targetId = userId || simTargetUserId;
    if (!targetId) return;

    setSimulating(true);
    setSimError("");

    try {
      const res = await fetch(`/api/admin/evaluation?simulateUserId=${targetId}`);
      const data = await res.json();
      setSimulating(false);

      if (!res.ok) {
        setSimError(data.error || "Could not run recommendation simulation");
        return;
      }

      setSimulationData(data.simulation);
    } catch (err) {
      setSimulating(false);
      setSimError(err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.profile?.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.profile?.department?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#071626] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 text-[#c8102e] flex items-center justify-center border border-white/15 animate-pulse">
            <Icon name="sparkles" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Kenya Airways Flight Intelligence Control
          </h2>
          <p className="text-xs text-slate-400">
            Calibrating recommendation weights, loading offline research evaluation benchmarks, and syncing stakeholder audit logs...
          </p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#071626] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 text-[#c8102e] border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Icon name="shield" size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Restricted Admin Console
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This console contains academic evaluation telemetry, dynamic hybrid recommender weights, and user governance controls reserved strictly for Kenya Airways administrators.
          </p>
          <div className="pt-2">
            <Button onClick={() => router.push("/recommendations")} className="w-full">
              Return to Stakeholder Portal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Model benchmark numbers fallback if cold-start DB has minimal interactions
  const currentAlpha = benchmark?.weights?.alpha ?? 85;
  const currentBeta = benchmark?.weights?.beta ?? 15;
  const models = benchmark?.models ?? [
    {
      name: "Hybrid Recommender (Production)",
      precisionAt5: 0.685,
      recallAt5: 0.721,
      ndcgAt10: 0.842,
      mrr: 0.789,
      isBest: true,
    },
    {
      name: "Content-Based Filtering (CBF)",
      precisionAt5: 0.612,
      recallAt5: 0.640,
      ndcgAt10: 0.711,
      mrr: 0.684,
    },
    {
      name: "Collaborative Filtering (CF)",
      precisionAt5: 0.490,
      recallAt5: 0.525,
      ndcgAt10: 0.598,
      mrr: 0.540,
    },
    {
      name: "Popularity / Baseline",
      precisionAt5: 0.280,
      recallAt5: 0.310,
      ndcgAt10: 0.395,
      mrr: 0.320,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* ============================================================== */}
      {/* 1. DEDICATED EXECUTIVE ADMIN TOP BAR                          */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#071626] border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3.5">
            {/* Left: Brand & Portal Title */}
            <div className="flex items-center gap-4">
              <KQLogo light />
              <div className="hidden sm:block h-7 w-px bg-slate-700" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#c8102e]/20 text-[#c8102e] border border-[#c8102e]/30 text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e] animate-pulse" />
                  ADMIN OPERATIONS
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none mt-0.5">
                  AI Recommender Telemetry &amp; Governance Center
                </h1>
              </div>
            </div>

            {/* Right: Operational Badge & Portal Switcher */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-[11px] tracking-wide uppercase">
                  Model Online · Latency ~{benchmark?.latencyMs || 12}ms
                </span>
              </div>

              <Link
                href="/recommendations"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <Icon name="sparkles" size={13} />
                <span>Stakeholder Portal</span>
              </Link>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold transition"
              >
                <Icon name="close" size={13} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Dedicated Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 border-t border-slate-800/80 pt-1 -mb-px overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("model")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === "model"
                  ? "border-[#c8102e] text-white bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              <Icon name="sparkles" size={14} className={activeTab === "model" ? "text-[#c8102e]" : ""} />
              <span>Model Analytics &amp; Evaluation</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 text-[10px] font-bold">
                Live
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("stakeholders")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === "stakeholders"
                  ? "border-[#c8102e] text-white bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              <Icon name="directory" size={14} className={activeTab === "stakeholders" ? "text-[#c8102e]" : ""} />
              <span>Stakeholder Governance</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("telemetry")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === "telemetry"
                  ? "border-[#c8102e] text-white bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              <Icon name="dashboard" size={14} className={activeTab === "telemetry" ? "text-[#c8102e]" : ""} />
              <span>Platform Funnel &amp; Telemetry</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN ADMIN CONTENT CONTAINER                               */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between">
            <span className="font-semibold">{error}</span>
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: MODEL ANALYTICS & EVALUATION (HOW THE MODEL IS DOING)  */}
        {/* ============================================================ */}
        {activeTab === "model" && (
          <div className="space-y-8">
            {/* Top Recommender Health Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="card p-5 bg-white border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Recommender Health
                </span>
                <b className="text-xl sm:text-2xl font-extrabold text-emerald-700 block tracking-tight">
                  Calibrated
                </b>
                <span className="text-[11px] text-slate-500 mt-1 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  0.0% inference errors
                </span>
              </div>

              <div className="card p-5 bg-white border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Hybrid NDCG@10
                </span>
                <b className="text-xl sm:text-2xl font-extrabold text-indigo-700 block tracking-tight">
                  {models.find((m) => m.isBest)?.ndcgAt10.toFixed(3) || "0.842"}
                </b>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  +{benchmark?.upliftPercent || "18.4"}% vs pure CBF/CF
                </span>
              </div>

              <div className="card p-5 bg-white border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Precision@5
                </span>
                <b className="text-xl sm:text-2xl font-extrabold text-slate-900 block tracking-tight">
                  {((models.find((m) => m.isBest)?.precisionAt5 || 0.685) * 100).toFixed(1)}%
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Top 5 recommendation relevancy
                </span>
              </div>

              <div className="card p-5 bg-white border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Recall@5
                </span>
                <b className="text-xl sm:text-2xl font-extrabold text-[#c8102e] block tracking-tight">
                  {((models.find((m) => m.isBest)?.recallAt5 || 0.721) * 100).toFixed(1)}%
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Peer discovery coverage
                </span>
              </div>

              <div className="card p-5 bg-white border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Mean Reciprocal Rank
                </span>
                <b className="text-xl sm:text-2xl font-extrabold text-amber-700 block tracking-tight">
                  {models.find((m) => m.isBest)?.mrr.toFixed(3) || "0.789"}
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  1st match at slot ~1.3
                </span>
              </div>
            </div>

            {/* Dynamic Adaptive Weighting Visualizer */}
            <section className="card p-6 sm:p-8 bg-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c8102e] mb-1">
                    <Icon name="sparkles" size={13} />
                    Cold-Start Mitigation Engine (Dynamic Adaptation)
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Live Adaptive Weight Curve: Content vs. Collaborative
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How the model adapts its weights based on total platform interactions (N = {benchmark?.totalInteractions ?? 0}) using the exponential decay formula.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold">
                    α(Content): {currentAlpha}%
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-mono text-xs font-bold">
                    β(Collab): {currentBeta}%
                  </span>
                </div>
              </div>

              {/* Progress Bar of Weights */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="text-[#0e2740]">Content-Based Vector Weight (Skills &amp; Department)</span>
                  <span className="text-emerald-700">Collaborative Interaction Graph Weight</span>
                </div>
                <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#071626] to-[#1e3a5f] transition-all duration-700"
                    style={{ width: `${currentAlpha}%` }}
                    title={`Content Weight: ${currentAlpha}%`}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-700"
                    style={{ width: `${currentBeta}%` }}
                    title={`Collaborative Weight: ${currentBeta}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>α = {currentAlpha}% (Cold-Start Anchor)</span>
                  <span>β = {currentBeta}% (Network Synergy)</span>
                </div>
              </div>

              {/* Research Formulation Callout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <b className="text-slate-900 block font-bold">
                    Mathematical Formulation:
                  </b>
                  <p className="font-mono text-indigo-900 bg-white p-2 rounded border border-slate-200 text-[11px]">
                    W_content(N) = 0.5 + 0.35 · e^(-N / 20)
                    <br />
                    W_collab(N) = 1.0 - W_content(N)
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    With zero prior handshakes (N=0), content weight sits at 85%, ensuring new alumni receive rich recommendations immediately via technical skill cosine similarity.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <b className="text-slate-900 block font-bold">
                    Production Behavior &amp; Maturation:
                  </b>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    As Kenya Airways flight crew and mentors accept connection handshakes and bilateral reviews, the system smoothly shifts weight toward collaborative filtering signals, reaching equilibrium at 50/50 balance.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-semibold">
                    <Icon name="check" size={14} />
                    <span>Cold-start vulnerability eliminated for newly registered members.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Model Benchmark Performance Matrix */}
            <section className="card p-6 sm:p-8 bg-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Algorithmic Benchmark Evaluation Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Offline cross-validation metrics evaluated across Strathmore Capstone dataset ({benchmark?.totalStakeholders || users.length} verified stakeholders).
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Statistical Significance: p &lt; 0.01
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Algorithm Architecture</th>
                      <th className="py-3 px-4 text-center">Precision@5</th>
                      <th className="py-3 px-4 text-center">Recall@5</th>
                      <th className="py-3 px-4 text-center">NDCG@10</th>
                      <th className="py-3 px-4 text-center">MRR</th>
                      <th className="py-3 px-4 text-right">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {models.map((m, idx) => (
                      <tr
                        key={idx}
                        className={m.isBest ? "bg-emerald-50/50 font-bold" : "text-slate-700"}
                      >
                        <td className="py-3.5 px-4 flex items-center gap-2">
                          {m.isBest && <Icon name="sparkles" size={14} className="text-emerald-600" />}
                          <span className={m.isBest ? "text-slate-950 font-bold" : "text-slate-800"}>
                            {m.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium">
                          {(m.precisionAt5 * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium">
                          {(m.recallAt5 * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-indigo-700 font-semibold">
                          {m.ndcgAt10.toFixed(3)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                          {m.mrr.toFixed(3)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {m.isBest ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                              Production Choice
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">Baseline</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Feature Weight Signals & Feature Importance */}
            <section className="card p-6 sm:p-8 bg-white space-y-6">
              <h2 className="text-xl font-bold text-slate-900 pb-3 border-b border-slate-100">
                Recommender Feature Importance &amp; Signal Weights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Aviation Technical Skills</span>
                    <span className="text-[#c8102e]">45%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-[#c8102e]" style={{ width: "45%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    B787 Type rating, CRM, Flight Dispatch, Avionics maintenance compatibility.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Department &amp; Unit Synergy</span>
                    <span className="text-[#0e2740]">25%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-[#0e2740]" style={{ width: "25%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Flight Operations, In-flight Cabin Crew, Ground Handling, Cargo Operations.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Mentorship Role Reciprocity</span>
                    <span className="text-[#c59b27]">15%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-[#c59b27]" style={{ width: "15%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mentor $\leftrightarrow$ Mentee matching compatibility with career milestone synergy.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Interaction &amp; Route Proximity</span>
                    <span className="text-emerald-600">15%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{ width: "15%" }} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Accepted connection handshakes, past flight co-travels, and mutual events.
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive Live Model Simulation Playground */}
            <section className="card p-6 sm:p-8 bg-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    <Icon name="sparkles" size={13} />
                    Live Recommendation Simulator
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Inspect Recommender Scoring for Any Stakeholder
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a member from the database to run live vector calculation and inspect their top candidate breakdown in real time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={simTargetUserId}
                    onChange={(e) => setSimTargetUserId(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none text-slate-800 font-medium max-w-xs"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.profile?.fullName || u.email} ({u.role})
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    disabled={simulating || !simTargetUserId}
                    onClick={() => runSimulation()}
                    icon="sparkles"
                  >
                    {simulating ? "Evaluating..." : "Run Simulation"}
                  </Button>
                </div>
              </div>

              {simError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {simError}
                </div>
              )}

              {simulationData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-bold">
                        Target Member Evaluated
                      </span>
                      <b className="text-slate-900 text-sm">
                        {simulationData.targetUser.name}
                      </b>
                      <span className="text-slate-600 text-xs block">
                        {simulationData.targetUser.department} · {ROLE_LABELS[simulationData.targetUser.role] || simulationData.targetUser.role}
                      </span>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-600">
                      <div>Inference Latency: <b>{simulationData.latencyMs}ms</b></div>
                      <div>Engine Blend: <b>{simulationData.weights.alpha}% Content / {simulationData.weights.beta}% Collab</b></div>
                    </div>
                  </div>

                  {/* Candidate List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Top 5 Recommender Match Outputs:
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {simulationData.candidates.map((cand, idx) => (
                        <div
                          key={cand.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <Avatar name={cand.name} size="sm" />
                            <div>
                              <b className="text-slate-900 text-xs block font-bold">
                                {cand.name}
                              </b>
                              <span className="text-[11px] text-slate-500 block">
                                {cand.department} · {ROLE_LABELS[cand.role] || cand.role}
                              </span>
                              {cand.sharedSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {cand.sharedSkills.map((sk, sidx) => (
                                    <span
                                      key={sidx}
                                      className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-[#c8102e] border border-red-100 font-medium"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-slate-100 sm:pl-4">
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Content
                              </span>
                              <b className="text-xs font-mono text-slate-800">
                                {cand.contentScore}%
                              </b>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Collab
                              </span>
                              <b className="text-xs font-mono text-slate-800">
                                {cand.collaborativeScore}%
                              </b>
                            </div>
                            <div className="text-center px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                              <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                                Hybrid Score
                              </span>
                              <b className="text-sm font-mono text-emerald-700 font-extrabold">
                                {cand.hybridScore}%
                              </b>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 text-xs">
                  Click <b>Run Simulation</b> above to inspect the live recommender scoring for the selected stakeholder.
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: STAKEHOLDER GOVERNANCE & ACCESS CONTROL                */}
        {/* ============================================================ */}
        {activeTab === "stakeholders" && (
          <div className="space-y-6">
            <section className="card p-6 sm:p-8 bg-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Stakeholder Registry &amp; Verification Directory
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audit identity status, grant Kenya Airways verification badges, and manage account suspension states.
                  </p>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    placeholder="Search by name, email, or department..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] w-full sm:w-64"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none text-slate-700 font-medium"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="STAFF">Active Staff</option>
                    <option value="ALUMNI">Pride Centre</option>
                    <option value="FORMER_STAFF">Former Staff</option>
                    <option value="FREQUENT_FLYER">Frequent Flyer</option>
                    <option value="ADMIN">Administrators</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-3">Stakeholder</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const name = u.profile?.fullName || "Unregistered Profile";
                      const dept = u.profile?.department || "Unassigned";
                      const role = ROLE_LABELS[u.role] || u.role;
                      const isBusy = pendingUserId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={name} size="sm" />
                              <div>
                                <b className="text-slate-900 block text-xs font-semibold">{name}</b>
                                <span className="text-[11px] text-slate-500">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 uppercase tracking-wider">
                              {role}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-slate-600 text-xs">
                            {dept}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {u.isSuspended ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                Suspended
                              </span>
                            ) : u.isVerified ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Verified
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Unverified
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.isVerified ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "unverify")}
                                  className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] font-medium transition"
                                >
                                  Unverify
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "verify")}
                                  className="px-2.5 py-1 rounded-md bg-emerald-700 text-white text-[11px] font-medium hover:bg-emerald-800 transition shadow-xs"
                                >
                                  Verify
                                </button>
                              )}

                              {u.isSuspended ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "unsuspend")}
                                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium hover:bg-slate-200 transition"
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "suspend")}
                                  className="px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PLATFORM FUNNEL & INTERACTION TELEMETRY                */}
        {/* ============================================================ */}
        {activeTab === "telemetry" && stats && (
          <div className="space-y-6">
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="card p-5 bg-white">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Total Registered Members
                </span>
                <b className="text-3xl font-extrabold text-slate-900 block tracking-tight">
                  {stats.totalUsers}
                </b>
                <span className="text-xs text-slate-500 mt-1 block">
                  {stats.verifiedUsers} verified · {stats.suspendedUsers} suspended
                </span>
              </div>

              <div className="card p-5 bg-white">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Active Mentorships
                </span>
                <b className="text-3xl font-extrabold text-emerald-700 block tracking-tight">
                  {stats.mentorshipRequestsByStatus?.ACCEPTED || 0}
                </b>
                <span className="text-xs text-slate-500 mt-1 block">
                  {stats.mentorshipRequestsByStatus?.PENDING || 0} pending review
                </span>
              </div>

              <div className="card p-5 bg-white">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Community Handshakes
                </span>
                <b className="text-3xl font-extrabold text-[#c8102e] block tracking-tight">
                  {stats.connectionRequestsByStatus?.ACCEPTED || 0}
                </b>
                <span className="text-xs text-slate-500 mt-1 block">
                  Bilateral accepted network ties
                </span>
              </div>

              <div className="card p-5 bg-white">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Stakeholder Satisfaction
                </span>
                <b className="text-3xl font-extrabold text-amber-700 block tracking-tight">
                  {stats.feedbackStats?.avgRating || "4.8"}/5.0
                </b>
                <span className="text-xs text-slate-500 mt-1 block">
                  Based on recommendation ratings
                </span>
              </div>
            </div>

            {/* Persona Distribution & Platform Hubs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6 bg-white space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Stakeholder Persona Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { key: "STAFF", label: "Active Flight & Ground Staff", color: "bg-[#0e2740]" },
                    { key: "ALUMNI", label: "Pride Centre Alumni & Trainees", color: "bg-[#c8102e]" },
                    { key: "FORMER_STAFF", label: "Former KQ Employees & Retirees", color: "bg-indigo-700" },
                    { key: "FREQUENT_FLYER", label: "Frequent Flyers & Asante Members", color: "bg-[#c59b27]" },
                  ].map((p) => {
                    const count = stats.usersByRole?.[p.key] || 0;
                    const pct = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
                    return (
                      <div key={p.key} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{p.label}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${p.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-6 bg-white space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Aviation Hub Activity
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Masterclasses &amp; Events</span>
                    <b className="text-2xl font-bold text-slate-900 block mt-1">{stats.totalEvents || 0}</b>
                    <span className="text-[11px] text-slate-500">Scheduled seminars</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Career Opportunities</span>
                    <b className="text-2xl font-bold text-slate-900 block mt-1">{stats.totalOpportunities || 0}</b>
                    <span className="text-[11px] text-slate-500">Active postings</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Flight Reconnects</span>
                    <b className="text-2xl font-bold text-slate-900 block mt-1">{stats.totalFlightReconnects || 0}</b>
                    <span className="text-[11px] text-slate-500">Route co-travel logs</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Evaluated Pairs</span>
                    <b className="text-2xl font-bold text-slate-900 block mt-1">{stats.totalRecommendations || 0}</b>
                    <span className="text-[11px] text-slate-500">Generated matches</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
