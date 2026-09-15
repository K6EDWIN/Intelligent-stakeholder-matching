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

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
};

function RequestCard({ req, kind, direction, onRespond }) {
  const counterpart = direction === "received" ? req.sender : req.receiver;
  const name = counterpart?.profile?.fullName || "Unknown";
  const role = ROLE_LABELS[counterpart?.role] || counterpart?.role;

  return (
    <div className="border rounded-lg p-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold">{name}</p>
          <span className="text-xs text-gray-500">{role}</span>
        </div>
        {req.message && (
          <p className="text-sm text-gray-600 mt-1">&quot;{req.message}&quot;</p>
        )}
        <span
          className={`inline-block mt-2 text-xs rounded-full px-2 py-0.5 ${
            STATUS_STYLES[req.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {req.status}
        </span>
      </div>

      {direction === "received" && req.status === "PENDING" && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onRespond(kind, req.id, "ACCEPTED")}
            className="text-xs bg-black text-white rounded px-3 py-1"
          >
            Accept
          </button>
          <button
            onClick={() => onRespond(kind, req.id, "DECLINED")}
            className="text-xs border rounded px-3 py-1"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

function RequestSection({ title, requests, kind, direction, onRespond, emptyText }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {requests.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <RequestCard
              key={r.id}
              req={r}
              kind={kind}
              direction={direction}
              onRespond={onRespond}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function RequestsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [mentorship, setMentorship] = useState({ sent: [], received: [] });
  const [connections, setConnections] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/mentorship-requests"),
        fetch("/api/connection-requests"),
      ]);
      const [mData, cData] = await Promise.all([mRes.json(), cRes.json()]);

      if (!mRes.ok || !cRes.ok) {
        setError(mData.error || cData.error || "Could not load requests");
        setLoading(false);
        return;
      }

      setMentorship(mData);
      setConnections(cData);
      setLoading(false);
    }

    load();
  }, [status]);

  const respond = async (kind, id, newStatus) => {
    const endpoint =
      kind === "mentorship" ? "mentorship-requests" : "connection-requests";
    const res = await fetch(`/api/${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) return;

    const setter = kind === "mentorship" ? setMentorship : setConnections;
    setter((prev) => ({
      ...prev,
      received: prev.received.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r
      ),
    }));
  };

  if (status === "loading" || loading) {
    return <div className="max-w-3xl mx-auto mt-16 p-6">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Requests</h1>
        <p className="text-gray-500 text-sm">
          Manage mentorship and connection requests you&apos;ve sent or
          received.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <RequestSection
        title="Mentorship — Received"
        requests={mentorship.received}
        kind="mentorship"
        direction="received"
        onRespond={respond}
        emptyText="No mentorship requests received yet."
      />
      <RequestSection
        title="Mentorship — Sent"
        requests={mentorship.sent}
        kind="mentorship"
        direction="sent"
        onRespond={respond}
        emptyText="You haven't sent any mentorship requests yet."
      />
      <RequestSection
        title="Connections — Received"
        requests={connections.received}
        kind="connection"
        direction="received"
        onRespond={respond}
        emptyText="No connection requests received yet."
      />
      <RequestSection
        title="Connections — Sent"
        requests={connections.sent}
        kind="connection"
        direction="sent"
        onRespond={respond}
        emptyText="You haven't sent any connection requests yet."
      />
    </div>
  );
}
