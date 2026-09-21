"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session.user.role !== "ADMIN") return;

    async function load() {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
      ]);
      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        setError(statsData.error || usersData.error || "Could not load admin data");
        setLoading(false);
        return;
      }

      setStats(statsData);
      setUsers(usersData.users);
      setLoading(false);
    }

    load();
  }, [status, session]);

  const runAction = async (userId, action) => {
    setPendingUserId(userId);

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();

    setPendingUserId(null);

    if (!res.ok) return;

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)));
  };

  if (status === "loading" || loading) {
    return <div className="max-w-3xl mx-auto mt-16 p-6">Loading...</div>;
  }

  if (status === "authenticated" && session.user.role !== "ADMIN") {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Admins only</h1>
        <p className="text-gray-600">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Platform stats, user verification, and moderation.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Verified" value={stats.verifiedUsers} />
          <StatCard label="Suspended" value={stats.suspendedUsers} />
          <StatCard label="Events" value={stats.totalEvents} />
          <StatCard label="Opportunities" value={stats.totalOpportunities} />
          <StatCard
            label="Mentorship accepted"
            value={stats.mentorshipRequestsByStatus.ACCEPTED || 0}
          />
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Users</h2>
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="border rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold">
                  {u.profile?.fullName || "(no profile)"}
                </p>
                <p className="text-sm text-gray-600">{u.email}</p>
                <div className="flex gap-2 mt-1">
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      u.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {u.isVerified ? "Verified" : "Unverified"}
                  </span>
                  {u.isSuspended && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-red-100 text-red-800">
                      Suspended
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    runAction(u.id, u.isVerified ? "UNVERIFY" : "VERIFY")
                  }
                  disabled={pendingUserId === u.id}
                  className="text-xs border rounded px-3 py-1 disabled:opacity-50"
                >
                  {u.isVerified ? "Unverify" : "Verify"}
                </button>
                <button
                  onClick={() =>
                    runAction(u.id, u.isSuspended ? "UNSUSPEND" : "SUSPEND")
                  }
                  disabled={pendingUserId === u.id}
                  className="text-xs border rounded px-3 py-1 disabled:opacity-50"
                >
                  {u.isSuspended ? "Unsuspend" : "Suspend"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
