"use client";

import { useEffect, useState } from "react";
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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

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
        setUsers(usersData.users || []);
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.profile?.fullName?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (status === "loading" || loading) {
    return (
      <KQAppShell>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 text-[#0e2740] flex items-center justify-center">
            <Icon name="dashboard" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Loading System Telemetry &amp; Evaluation Suite...
          </h2>
        </div>
      </KQAppShell>
    );
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return (
      <KQAppShell>
        <div className="max-w-md mx-auto my-20 p-8 bg-white border border-slate-200 rounded-xl text-center shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-[#c8102e] rounded-full flex items-center justify-center mx-auto">
            <Icon name="shield" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This dashboard contains academic evaluation benchmarks, algorithmic telemetry, and user verification controls reserved for authorized Kenya Airways system administrators.
          </p>
          <Button onClick={() => router.push("/recommendations")}>
            Return to Dashboard
          </Button>
        </div>
      </KQAppShell>
    );
  }

  return (
    <KQAppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#c8102e]/10 text-[#c8102e] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Icon name="shield" size={13} />
              Enterprise Administration &amp; Research Telemetry
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              System Governance &amp; Algorithm Evaluation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Strathmore University Capstone validation suite, recommender metrics (Precision, Recall, NDCG), and stakeholder account controls.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800">Telemetry Operational</span>
          </div>
        </div>

        {/* Top 4 Telemetry Metrics Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="card p-5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Verified Stakeholders
              </span>
              <b className="text-2xl sm:text-3xl font-extrabold text-slate-900 block tracking-tight">
                {stats.verifiedUsers}
              </b>
              <small className="text-xs text-slate-500 mt-1 block">
                of {stats.totalUsers} registered members
              </small>
            </div>

            <div className="card p-5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Active Mentorships
              </span>
              <b className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block tracking-tight">
                {stats.mentorshipRequestsByStatus?.ACCEPTED || 0}
              </b>
              <small className="text-xs text-slate-500 mt-1 block">
                {stats.mentorshipRequestsByStatus?.PENDING || 0} pending review
              </small>
            </div>

            <div className="card p-5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Community Connections
              </span>
              <b className="text-2xl sm:text-3xl font-extrabold text-[#c8102e] block tracking-tight">
                {stats.connectionRequestsByStatus?.ACCEPTED || 0}
              </b>
              <small className="text-xs text-slate-500 mt-1 block">
                Bilateral accepted handshakes
              </small>
            </div>

            <div className="card p-5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Events &amp; Opportunities
              </span>
              <b className="text-2xl sm:text-3xl font-extrabold text-amber-700 block tracking-tight">
                {(stats.totalEvents || 0) + (stats.totalOpportunities || 0)}
              </b>
              <small className="text-xs text-slate-500 mt-1 block">
                {stats.totalEvents} Masterclasses · {stats.totalOpportunities} Jobs
              </small>
            </div>
          </div>
        )}

        {/* Capstone Benchmark Evaluation Suite */}
        {benchmark && (
          <section className="card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c8102e] mb-1">
                  <Icon name="sparkles" size={13} />
                  Research Benchmark Evaluation (Issue #11)
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recommender Performance vs. Baselines
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Offline cross-validation benchmark evaluated across {benchmark.totalStakeholders} verified stakeholders and {benchmark.totalInteractions} community interactions.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                  Current α: <b>{benchmark.weights.alpha}%</b>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                  Current β: <b>{benchmark.weights.beta}%</b>
                </span>
              </div>
            </div>

            {/* Performance Comparison Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4">Algorithm Model</th>
                    <th className="py-3 px-4 text-center">Precision@5</th>
                    <th className="py-3 px-4 text-center">Recall@5</th>
                    <th className="py-3 px-4 text-center">NDCG@10</th>
                    <th className="py-3 px-4 text-center">MRR</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {benchmark.models.map((m, idx) => (
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
                            Superior
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

            {/* Academic Analysis Note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <b className="text-slate-900 block font-bold">
                Empirical Research Insight:
              </b>
              <p className="leading-relaxed">
                The cold-start-aware Hybrid Recommender achieves the highest NDCG@10 and Precision@5 by leveraging skill vector compatibility for newly registered stakeholders (cold-start mitigation) while progressively integrating collaborative filtering signals as accepted mentorship pairs grow.
              </p>
            </div>
          </section>
        )}

        {/* User Governance & Verification Directory */}
        <section className="card p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Stakeholder Registry &amp; Verification
              </h2>
              <p className="text-xs text-slate-500">
                Audit stakeholder status, grant Kenya Airways verification badges, and manage account privileges.
              </p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                placeholder="Search by email or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e]"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="STAFF">Active Staff</option>
                <option value="ALUMNI">Pride Centre</option>
                <option value="FORMER_STAFF">Former Staff</option>
                <option value="FREQUENT_FLYER">Frequent Flyer</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Stakeholder</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const name = u.profile?.fullName || "Unregistered Profile";
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

                      <td className="py-3.5 px-3 text-center">
                        {u.isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            Suspended
                          </span>
                        ) : u.isVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
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
                              className="px-2.5 py-1 rounded-md bg-emerald-700 text-white text-[11px] font-medium hover:bg-emerald-800 transition shadow-sm"
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
    </KQAppShell>
  );
}
