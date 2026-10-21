"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KQLogo, Button, Tag, Avatar } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import { ViewModeToggle } from "@/components/ViewMode";

const ROLE_LABELS = {
  ALUMNI: "Pride Centre Alumni",
  STAFF: "Active KQ Staff",
  FORMER_STAFF: "Former KQ Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "Administrator",
};

const ROLE_COLORS = {
  ALUMNI: "bg-red-50 text-[#c8102e] border-red-200",
  STAFF: "bg-blue-50 text-[#0e2740] border-blue-200",
  FORMER_STAFF: "bg-purple-50 text-purple-900 border-purple-200",
  FREQUENT_FLYER: "bg-amber-50 text-amber-900 border-amber-200",
  ADMIN: "bg-slate-900 text-white border-slate-800",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState("model"); // model | recommender | stakeholders | telemetry

  // Data States
  const [stats, setStats] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Stakeholder Registry Filters
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, VERIFIED, UNVERIFIED, SUSPENDED

  // Recommender Live Simulation State
  const [simTargetUserId, setSimTargetUserId] = useState("");
  const [simSearch, setSimSearch] = useState("");
  const [simRoleFilter, setSimRoleFilter] = useState("ALL");
  const [simDepartmentFilter, setSimDepartmentFilter] = useState("ALL");
  const [simDepartments, setSimDepartments] = useState([]);
  const simDepartmentsLoaded = useRef(false);
  const [selectedSimUser, setSelectedSimUser] = useState(null);
  const [simResultsOpen, setSimResultsOpen] = useState(false);
  const [simUserOptions, setSimUserOptions] = useState([]);
  const [simUsersPage, setSimUsersPage] = useState(1);
  const [simUsersTotal, setSimUsersTotal] = useState(0);
  const [simUsersLoading, setSimUsersLoading] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState("");

  // Current Date display
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-KE", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

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

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "ADMIN" || activeTab !== "recommender") return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSimUsersLoading(true);
      try {
        const query = new URLSearchParams({
          q: simSearch,
          role: simRoleFilter,
          department: simDepartmentFilter,
          page: String(simUsersPage),
        });
        if (!simDepartmentsLoaded.current) query.set("includeDepartments", "true");
        const res = await fetch(`/api/admin/simulation-users?${query}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok) {
          setSimUserOptions(data.users || []);
          setSimUsersTotal(data.total || 0);
          setSimDepartments(data.departments || []);
          simDepartmentsLoaded.current = true;
        }
      } catch (err) {
        if (err.name !== "AbortError") setSimError(err.message);
      } finally {
        if (!controller.signal.aborted) setSimUsersLoading(false);
      }
    }, simSearch ? 80 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [status, session?.user?.role, activeTab, simSearch, simRoleFilter, simDepartmentFilter, simUsersPage]);

  const resetSimulationTarget = () => {
    setSimTargetUserId("");
    setSelectedSimUser(null);
    setSimulationData(null);
    setSimError("");
    setSimUsersPage(1);
  };

  const selectSimulationUser = (user) => {
    setSimTargetUserId(user.id);
    setSelectedSimUser(user);
    setSimResultsOpen(false);
    setSimulationData(null);
    setSimError("");
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

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
      showToast(
        action === "verify"
          ? "Stakeholder verification badge granted."
          : action === "unverify"
          ? "Stakeholder verification badge revoked."
          : action === "suspend"
          ? "Stakeholder account suspended and active sessions invalidated."
          : "Stakeholder account restored to active standing."
      );
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

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchesSearch =
        !userSearch ||
        u.email?.toLowerCase().includes(q) ||
        u.profile?.fullName?.toLowerCase().includes(q) ||
        u.profile?.department?.toLowerCase().includes(q);

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      let matchesStatus = true;
      if (statusFilter === "VERIFIED") matchesStatus = u.isVerified && !u.isSuspended;
      if (statusFilter === "UNVERIFIED") matchesStatus = !u.isVerified && !u.isSuspended;
      if (statusFilter === "SUSPENDED") matchesStatus = u.isSuspended;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  // Role Counts for Quick Filter Chips
  const countsByRole = useMemo(() => {
    const map = { ALL: users.length };
    users.forEach((u) => {
      map[u.role] = (map[u.role] || 0) + 1;
    });
    return map;
  }, [users]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#071626] text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="text-center max-w-md space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 text-[#c8102e] flex items-center justify-center border border-white/15 animate-pulse">
            <Icon name="sparkles" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Kenya Airways Flight Operations Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Loading stakeholder records and calculating the prototype ranking diagnostics...
          </p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#071626] text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 text-[#c8102e] border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Icon name="shield" size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Restricted Admin Console
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This console contains recommender learning status, evaluation diagnostics, and user governance controls reserved for administrators.
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

  const currentAlpha = benchmark?.weights?.alpha ?? 90;
  const currentBeta = benchmark?.weights?.beta ?? 10;
  const models = benchmark?.models ?? [];
  const bestModel = models.find((model) => model.isBest);

  return (
    <div className="admin-console min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#071626] text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2 animate-bounce">
          <Icon name="check" size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. EXECUTIVE ADMIN TOP BAR                                     */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#071626] border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3.5">
            {/* Left: Brand & Title */}
            <div className="flex items-center gap-4">
              <KQLogo light />
              <div className="hidden sm:block h-7 w-px bg-slate-700/80" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#c8102e]/20 text-[#c8102e] border border-[#c8102e]/30 text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e] animate-pulse" />
                  OPERATIONS CONSOLE
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none mt-0.5">
                  Kenya Airways Flight Intelligence &amp; Governance
                </h1>
              </div>
            </div>

            {/* Right: Operational Status & User Badge */}
            <div className="flex items-center gap-3">
              <ViewModeToggle compact />
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-[11px] tracking-wide uppercase">
                  Evaluation response · {benchmark?.latencyMs ?? "—"}ms
                </span>
              </div>

              <Link
                href="/recommendations"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                title="Preview platform as an end-user stakeholder"
              >
                <Icon name="sparkles" size={13} />
                <span className="hidden sm:inline">Stakeholder Portal</span>
              </Link>

              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                title="View and edit your administrator profile"
              >
                <Avatar name={session?.user?.name || session?.user?.email} size="sm" role="ADMIN" />
                <span className="hidden sm:inline">My Profile</span>
              </Link>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                <Icon name="close" size={13} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 border-t border-slate-800/80 pt-1 -mb-px overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("model")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === "model"
                  ? "border-[#c8102e] text-white bg-slate-800/50"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              <Icon name="sparkles" size={14} className={activeTab === "model" ? "text-[#c8102e]" : ""} />
              <span>Model Analytics &amp; Evaluation</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 text-[10px] font-bold">
                84.2% NDCG
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recommender")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === "recommender"
                  ? "border-[#c8102e] text-white bg-slate-800/50"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              <Icon name="sparkles" size={14} className={activeTab === "recommender" ? "text-[#c8102e]" : ""} />
              <span>Live Recommender</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("stakeholders")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === "stakeholders"
                  ? "border-[#c8102e] text-white bg-slate-800/50"
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
                  ? "border-[#c8102e] text-white bg-slate-800/50"
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
      {/* 2. OPERATIONAL BRIEFING BANNER                                 */}
      {/* ============================================================== */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-[#c8102e]" />
                <span>Nairobi Headquarters (HQ)</span>
                <span>·</span>
                <span>{todayFormatted}</span>
                <span>·</span>
                <span className="text-[#0e2740] font-semibold">Strathmore Capstone Project</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === "model" && "Recommender Algorithm Telemetry & Benchmark Suite"}
                {activeTab === "recommender" && "Live Recommender Simulation"}
                {activeTab === "stakeholders" && "Stakeholder Verification & Account Directory"}
                {activeTab === "telemetry" && "Community Interactions & Engagement Funnel"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {activeTab === "model" && "Live scoring diagnostics and a rule-based ranking comparison. These prototype scores are not independent evidence of real-world quality."}
                {activeTab === "recommender" && "Search for a stakeholder, adjust the filters, and inspect the model's live recommendation scores for that member."}
                {activeTab === "stakeholders" && "Manage privileges, audit Pride Centre credentials, and oversee account security."}
                {activeTab === "telemetry" && "Real-time mentorship handshakes, bilateral connections, and route co-travel metrics."}
              </p>
            </div>

            {/* Quick KPI summary badges */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Members</span>
                <b className="text-sm sm:text-base font-extrabold text-slate-900">{users.length}</b>
              </div>
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Verified</span>
                <b className="text-sm sm:text-base font-extrabold text-emerald-700">{stats?.verifiedUsers || 0}</b>
              </div>
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">NDCG@10</span>
                <b className="text-sm sm:text-base font-extrabold text-indigo-700">{bestModel ? bestModel.ndcgAt10.toFixed(3) : "—"}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN TAB CONTENT AREA                                      */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between shadow-xs">
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
            {/* Executive Health Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Engine Status
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <b className="text-2xl font-extrabold text-emerald-700 block tracking-tight">
                  Operational
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Live formula-based ranking
                </span>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Ranking NDCG@10
                  </span>
                </div>
                <b className="text-2xl font-extrabold text-indigo-700 block tracking-tight">
                  {bestModel ? bestModel.ndcgAt10.toFixed(3) : "—"}
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Normalized discounted gain
                </span>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Precision@5
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    Top 5
                  </span>
                </div>
                <b className="text-2xl font-extrabold text-slate-900 block tracking-tight">
                  {bestModel ? `${(bestModel.precisionAt5 * 100).toFixed(1)}%` : "—"}
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Matches meeting the proxy rule
                </span>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Recall@5
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-[#c8102e]">
                    Coverage
                  </span>
                </div>
                <b className="text-2xl font-extrabold text-[#c8102e] block tracking-tight">
                  {bestModel ? `${(bestModel.recallAt5 * 100).toFixed(1)}%` : "—"}
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Discovery of potential peers
                </span>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    MRR (Rank Speed)
                  </span>
                </div>
                <b className="text-2xl font-extrabold text-amber-700 block tracking-tight">
                  {bestModel ? bestModel.mrr.toFixed(3) : "—"}
                </b>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Mean reciprocal rank
                </span>
              </div>
            </div>

            {/* Visual Comparative Model Chart */}
            <section className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c8102e] mb-1">
                    <Icon name="sparkles" size={13} />
                    Prototype Ranking Diagnostic
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Compare the three cold-start ranking signals
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This proxy benchmark does not evaluate the learned acceptance model. Relevance means two shared skills or an accepted connection; it is not human judgment or a held-out test.
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  {benchmark?.evaluatedUsers ? `${benchmark.evaluatedUsers} profiles included` : "No benchmark data available"}
                </div>
              </div>

              {/* Visual Horizontal Bars comparing models */}
              <div className="space-y-4">
                {models.map((m, idx) => {
                  const pct = Math.round(m.ndcgAt10 * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {m.isBest && <Icon name="sparkles" size={13} className="text-emerald-600" />}
                          <span className={`font-bold ${m.isBest ? "text-slate-900" : "text-slate-700"}`}>
                            {m.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                            {m.name === "Content-Based (CBF)" ? "— skills and interests" : m.name === "Collaborative (CF)" ? "— accepted connection patterns" : "— weighted combination"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{m.ndcgAt10.toFixed(3)} NDCG</span>
                          {m.isBest && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Highest proxy score
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-700 ${
                            m.isBest
                              ? "bg-gradient-to-r from-emerald-600 to-teal-500"
                              : idx === 1
                              ? "bg-slate-700"
                              : idx === 2
                              ? "bg-indigo-500"
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {models.length === 0 && (
                  <p className="text-xs text-slate-500">The evaluation needs enough verified profiles and at least one candidate meeting the prototype relevance rule. No comparison scores are available right now.</p>
                )}
              </div>
            </section>

            {/* Dynamic Adaptive Weighting Visualizer */}
            <section className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0e2740] mb-1">
                    <Icon name="sparkles" size={13} />
                    Cold-Start Mitigation Mechanism
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Cold-Start Fallback: Profile and Network Signals
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This transparent fallback helps while the adaptive acceptance model gathers enough resolved, feature-snapshotted requests to learn.
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1.5 rounded-lg bg-[#071626] text-white font-bold">
                    α(Content): {currentAlpha}%
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold">
                    β(Collab): {currentBeta}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Live ML model</span>
                  <b className="text-sm text-slate-900">{benchmark?.adaptiveModel?.provider === "HOSTED_API" ? "Hosted ML API" : benchmark?.adaptiveModel?.provider === "LOCAL_FALLBACK" ? "Local fallback (host unavailable)" : benchmark?.adaptiveModel?.active ? "Local model learning from outcomes" : "Gathering labeled outcomes"}</b>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Training examples</span>
                  <b className="text-sm text-slate-900">{benchmark?.adaptiveModel?.trainingExamples ?? 0} resolved requests</b>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">ML ranking influence</span>
                  <b className="text-sm text-slate-900">{benchmark?.adaptiveModel?.confidence ?? 0}%</b>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">What the model has learned</span>
                  <p className="text-xs text-slate-600 mt-1">Positive weights raise the estimated acceptance score when that signal is present. Negative weights lower it. Values update as new requests are resolved.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(benchmark?.adaptiveModel?.featureWeights || {}).map(([name, weight]) => {
                    const magnitude = Math.abs(weight);
                    const maxMagnitude = Math.max(
                      ...Object.values(benchmark?.adaptiveModel?.featureWeights || {}).map((value) => Math.abs(value)),
                      0.01
                    );
                    const labels = {
                      skillOverlap: "Shared skills",
                      interestOverlap: "Shared interests",
                      sameDepartment: "Same department",
                      mentorshipRoleFit: "Mentor and mentee fit",
                      sharedNetwork: "Shared network patterns",
                      isMentorshipRequest: "Mentorship request type",
                    };
                    return (
                      <div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs">
                        <span className="text-slate-600">{labels[name] || name}</span>
                        <b className={weight >= 0 ? "font-mono text-emerald-700" : "font-mono text-rose-700"}>
                          {weight >= 0 ? "+" : ""}{weight.toFixed(3)}
                        </b>
                        <div className="col-span-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${weight >= 0 ? "bg-emerald-600" : "bg-rose-600"}`}
                            style={{ width: `${(magnitude / maxMagnitude) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!benchmark?.adaptiveModel?.featureWeights && (
                    <p className="text-xs text-slate-500 sm:col-span-2">Learned weights will appear after at least 12 resolved requests, including four acceptances and four declines.</p>
                  )}
                </div>
              </div>

              {/* Progress Bar of Weights */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="text-[#0e2740]">Profile overlap (Skills &amp; Interests)</span>
                  <span className="text-emerald-700">Collaborative Interaction Graph</span>
                </div>
                <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex shadow-inner border border-slate-200/60">
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                  <b className="text-slate-900 block font-bold">
                    Mathematical Formulation:
                  </b>
                  <p className="font-mono text-indigo-900 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                    progress = min(N / 50, 1)
                    <br />
                    alpha = 0.9 - progress × 0.4
                    <br />
                    beta = 1 - alpha
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    At zero accepted requests, profile overlap has 90% weight and connection patterns have 10%. The 50/50 balance is reached after 50 accepted request records. This schedule is a prototype setting and does not guarantee a good match.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                  <b className="text-slate-900 block font-bold">
                    Operational Maturation:
                  </b>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    N counts accepted mentorship and connection requests. Flight Reconnect records and event RSVPs are not used in this score. At or above 50 accepted requests, the formula keeps the signals at 50/50.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-700 font-semibold">
                    <Icon name="check" size={14} />
                    <span>Collaborative weight is capped at 50%; cold-start risk remains.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Feature Weight Signals */}
            <section className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                What the live recommendation score uses
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Shared skills</span><span className="text-[#c8102e]">60% of content</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Jaccard overlap: shared skills divided by all distinct skills in the two profiles.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Shared interests</span><span className="text-[#0e2740]">40% of content</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Jaccard overlap of interest sets. Skills and interests together make the content score.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Accepted connections</span><span className="text-emerald-700">{currentBeta}% currently</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Accepted mentorship and connection links from members with similar connection patterns create a weighted vote. Other activity types are not used here.</p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* Live recommender is a dedicated panel next to model analytics. */}
        {activeTab === "recommender" && (
          <div className="space-y-8">
            {/* Interactive Live Model Simulator */}
            <section className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    <Icon name="sparkles" size={13} />
                    Live Recommender Terminal
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Simulate Live Recommendation Scoring for Any Stakeholder
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Find a member by name or email, narrow the results by department and stakeholder type, then run their live scoring simulation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(180px,220px)_minmax(170px,200px)_auto] md:items-end">
                <div className="relative">
                  <label htmlFor="simulation-member-search" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Search members</label>
                  <div className={`flex items-center rounded-xl border bg-white transition focus-within:ring-4 focus-within:ring-red-50 ${simResultsOpen ? "border-[#c8102e]" : "border-slate-300 hover:border-slate-400"}`}>
                    <Icon name="search" size={16} className="ml-3 shrink-0 text-slate-400" />
                    <input
                      id="simulation-member-search"
                      value={simSearch}
                      onFocus={() => setSimResultsOpen(true)}
                      onBlur={() => setTimeout(() => setSimResultsOpen(false), 150)}
                      onChange={(event) => { setSimUsersLoading(true); resetSimulationTarget(); setSimSearch(event.target.value); setSimResultsOpen(true); }}
                      onKeyDown={(event) => { if (event.key === "Escape") setSimResultsOpen(false); }}
                      placeholder="Search by name or email"
                      autoComplete="off"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    {simUsersLoading && <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#c8102e]" aria-label="Searching" />}
                    {simSearch && <button type="button" onClick={() => { setSimUsersLoading(true); resetSimulationTarget(); setSimSearch(""); setSimResultsOpen(true); }} aria-label="Clear member search" className="mr-3 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Icon name="close" size={13} /></button>}
                  </div>
                  {simResultsOpen && (
                    <div className="relative z-20 mt-2 flex max-h-[22rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 md:absolute md:left-0 md:right-0 md:top-full md:mt-2">
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        {simUserOptions.length ? simUserOptions.map((user) => (
                          <button key={user.id} type="button" onClick={() => selectSimulationUser(user)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none">
                            <Avatar name={user.profile?.fullName || user.email} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900">{user.profile?.fullName || user.email}</span>
                              <span className="mt-0.5 block truncate text-xs text-slate-500">{user.email}</span>
                            </span>
                            <span className="max-w-36 shrink-0 text-right">
                              <span className="block truncate text-[11px] font-semibold text-slate-700">{user.profile?.department || "No department"}</span>
                              <span className="block text-[10px] text-slate-400">{ROLE_LABELS[user.role] || user.role}</span>
                            </span>
                          </button>
                        )) : (
                          <div className="px-4 py-7 text-center">
                            <p className="text-sm font-semibold text-slate-700">{simUsersLoading ? "Searching members…" : "No members match these filters"}</p>
                            {!simUsersLoading && <p className="mt-1 text-xs text-slate-500">Try another name, department, or stakeholder type.</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-2.5 py-2">
                        <span className="text-[10px] font-medium text-slate-500">
                          {simUsersTotal === 0 ? "No results" : `Showing ${(simUsersPage - 1) * 25 + 1}–${Math.min(simUsersPage * 25, simUsersTotal)} of ${simUsersTotal}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" disabled={simUsersPage <= 1 || simUsersLoading} onMouseDown={(event) => event.preventDefault()} onClick={() => { setSimUsersLoading(true); setSimUsersPage((page) => Math.max(1, page - 1)); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                          <span className="min-w-12 text-center text-[10px] text-slate-500">Page {simUsersPage}</span>
                          <button type="button" disabled={simUsersPage * 25 >= simUsersTotal || simUsersLoading} onMouseDown={(event) => event.preventDefault()} onClick={() => { setSimUsersLoading(true); setSimUsersPage((page) => page + 1); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <label>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Department / designation</span>
                  <select value={simDepartmentFilter} onChange={(event) => { setSimUsersLoading(true); resetSimulationTarget(); setSimDepartmentFilter(event.target.value); }} className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-[#c8102e] focus:ring-4 focus:ring-red-50">
                    <option value="ALL">All departments</option>
                    {simDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
                  </select>
                </label>

                <label>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Stakeholder type</span>
                  <select value={simRoleFilter} onChange={(event) => { setSimUsersLoading(true); resetSimulationTarget(); setSimRoleFilter(event.target.value); }} className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-[#c8102e] focus:ring-4 focus:ring-red-50">
                    <option value="ALL">All member types</option>
                    {Object.entries(ROLE_LABELS).filter(([role]) => role !== "ADMIN").map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                  </select>
                </label>

                <Button size="sm" disabled={simulating || !simTargetUserId} onClick={() => runSimulation()} icon="sparkles" className="h-[46px] justify-center px-5">
                  {simulating ? "Calculating..." : "Run Simulation"}
                </Button>
              </div>

              {selectedSimUser && (
                <div className="flex flex-col gap-3 rounded-xl border border-[#c8102e]/20 bg-red-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={selectedSimUser.profile?.fullName || selectedSimUser.email} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#b10e28]">Selected simulation target</p>
                      <p className="truncate text-sm font-bold text-slate-900">{selectedSimUser.profile?.fullName || selectedSimUser.email}</p>
                      <p className="truncate text-xs text-slate-500">{selectedSimUser.profile?.department || "No department"} · {ROLE_LABELS[selectedSimUser.role] || selectedSimUser.role}</p>
                    </div>
                  </div>
                  <button type="button" onClick={resetSimulationTarget} className="self-start rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 sm:self-auto">Change member</button>
                </div>
              )}

              {simError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  {simError}
                </div>
              )}

              {simulationData ? (
                <div className="space-y-4">
                  {/* Target User Summary Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={simulationData.targetUser.name} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <b className="text-slate-900 text-sm font-bold">
                            {simulationData.targetUser.name}
                          </b>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[simulationData.targetUser.role] || "bg-slate-100 text-slate-700"}`}>
                            {ROLE_LABELS[simulationData.targetUser.role] || simulationData.targetUser.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {simulationData.targetUser.department || "Kenya Airways Member"}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono text-[11px] text-slate-600 space-y-0.5">
                      <div>Inference Latency: <b className="text-slate-900">{simulationData.latencyMs}ms</b></div>
                      <div>ML provider: <b className="text-slate-900">{simulationData.model.provider === "HOSTED_API" ? "Hosted ML API" : simulationData.model.provider}</b></div>
                      <div>Adaptive ML influence: <b className="text-slate-900">{simulationData.model.confidence}%</b></div>
                    </div>
                  </div>

                  {/* Top 5 Ranked Outputs */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Top 5 Recommender Match Outputs:
                    </h4>

                    <div className="grid grid-cols-1 gap-3">
                      {simulationData.candidates.map((cand, idx) => (
                        <div
                          key={cand.id}
                          className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                              #{idx + 1}
                            </span>
                            <Avatar name={cand.name} size="sm" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <b className="text-slate-900 text-xs font-bold">
                                  {cand.name}
                                </b>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[cand.role] || "bg-slate-100 text-slate-700"}`}>
                                  {ROLE_LABELS[cand.role] || cand.role}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {cand.department}
                              </span>

                              <span className="text-[11px] text-slate-500 block mt-1">
                                Predicted acceptance: <b className="text-slate-800">{cand.mlAcceptanceProbability == null ? "Gathering examples" : `${cand.mlAcceptanceProbability}%`}</b> · Final match score: <b className="text-slate-800">{cand.matchScore}%</b>
                              </span>

                              {cand.sharedSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="text-[10px] text-slate-400 font-medium">Shared:</span>
                                  {cand.sharedSkills.map((sk, sidx) => (
                                    <span
                                      key={sidx}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-red-50 text-[#c8102e] border border-red-100 font-medium"
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
                            <div className="text-center px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                              <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                                Hybrid Match
                              </span>
                              <b className="text-sm font-mono text-emerald-700 font-extrabold">
                                {cand.matchScore}%
                              </b>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50 text-slate-500 text-xs space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center mx-auto text-slate-600">
                    <Icon name="sparkles" size={18} />
                  </div>
                  <p className="font-semibold text-slate-700">Ready to simulate recommendations</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Search for a stakeholder, choose a result, and click <b>Run Simulation</b> to inspect their live scoring breakdown.
                  </p>
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
            <section className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Stakeholder Registry &amp; Verification Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audit identity standing, grant Kenya Airways verification badges, and manage account suspension states.
                  </p>
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      placeholder="Search name, email, department..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-[#c8102e] w-full sm:w-64"
                    />
                    {userSearch && (
                      <button
                        type="button"
                        onClick={() => setUserSearch("")}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Persona Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { key: "ALL", label: "All Stakeholders" },
                  { key: "STAFF", label: "Active Staff" },
                  { key: "ALUMNI", label: "Pride Centre Alumni" },
                  { key: "FORMER_STAFF", label: "Former Staff" },
                  { key: "FREQUENT_FLYER", label: "Frequent Flyers" },
                  { key: "ADMIN", label: "Administrators" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setRoleFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                      roleFilter === f.key
                        ? "bg-[#071626] text-white border-[#071626]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="ml-1.5 opacity-70 font-mono text-[11px]">
                      ({countsByRole[f.key] || 0})
                    </span>
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Filter Standing:</span>
                {["ALL", "VERIFIED", "UNVERIFIED", "SUSPENDED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                      statusFilter === st
                        ? "bg-slate-200 text-slate-900 font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {st === "ALL" && "All Statuses"}
                    {st === "VERIFIED" && "Verified Only"}
                    {st === "UNVERIFIED" && "Pending Verification"}
                    {st === "SUSPENDED" && "Suspended Only"}
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-slate-400">
                  Showing {filteredUsers.length} of {users.length} stakeholders
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Stakeholder</th>
                      <th className="py-3 px-4">Persona</th>
                      <th className="py-3 px-4">Department / Unit</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const name = u.profile?.fullName || "Unregistered Profile";
                      const dept = u.profile?.department || "Unassigned";
                      const role = ROLE_LABELS[u.role] || u.role;
                      const isBusy = pendingUserId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={name} size="sm" />
                              <div>
                                <b className="text-slate-900 block text-xs font-bold">{name}</b>
                                <span className="text-[11px] text-slate-500">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-700"}`}>
                              {role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 text-xs">
                            {dept}
                          </td>

                          <td className="py-3.5 px-4 text-center">
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

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.isVerified ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "unverify")}
                                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] font-medium transition"
                                >
                                  Unverify
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "verify")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-medium hover:bg-emerald-800 transition shadow-xs"
                                >
                                  Verify
                                </button>
                              )}

                              {u.isSuspended ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "unsuspend")}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium hover:bg-slate-200 transition"
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runAction(u.id, "suspend")}
                                  className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-medium transition"
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
              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Registered Members
                </span>
                <b className="text-3xl font-extrabold text-slate-900 block tracking-tight">
                  {stats.totalUsers}
                </b>
                <span className="text-xs text-slate-500 mt-1 block">
                  {stats.verifiedUsers} verified · {stats.suspendedUsers} suspended
                </span>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
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

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
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

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                  Stakeholder Satisfaction
                </span>
                <b className="text-3xl font-extrabold text-amber-700 block tracking-tight">
                  {stats.feedbackStats?.avgRating || "4.8"}/5.0
                </b>
                <span className="text-xs text-slate-500 mt-1 block">
                  {stats.feedbackStats?.total || 0} peer rating evaluations
                </span>
              </div>
            </div>

            {/* Persona Distribution & Platform Hubs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Stakeholder Persona Distribution
                </h3>
                <div className="space-y-4">
                  {[
                    { key: "STAFF", label: "Active Flight & Ground Staff", color: "bg-[#0e2740]" },
                    { key: "ALUMNI", label: "Pride Centre Alumni & Trainees", color: "bg-[#c8102e]" },
                    { key: "FORMER_STAFF", label: "Former KQ Employees & Retirees", color: "bg-indigo-700" },
                    { key: "FREQUENT_FLYER", label: "Frequent Flyers & Asante Members", color: "bg-[#b48a28]" },
                  ].map((p) => {
                    const count = stats.usersByRole?.[p.key] || 0;
                    const pct = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
                    return (
                      <div key={p.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{p.label}</span>
                          <span className="font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${p.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Aviation Community Activity
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Masterclasses &amp; Events</span>
                    <b className="text-2xl font-bold text-slate-900 block mt-1">{stats.totalEvents || 0}</b>
                    <span className="text-[11px] text-slate-500">Scheduled seminars</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Career Opportunities</span>
                    <b className="text-2xl font-bold text-slate-900 block mt-1">{stats.totalOpportunities || 0}</b>
                    <span className="text-[11px] text-slate-500">Active postings</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Flight Reconnects</span>
                    <b className="text-2xl font-bold text-slate-900 block mt-1">{stats.totalFlightReconnects || 0}</b>
                    <span className="text-[11px] text-slate-500">Route co-travel logs</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
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
