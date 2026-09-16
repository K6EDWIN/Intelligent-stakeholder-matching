"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RequestActions from "@/components/RequestActions";

const ROLE_LABELS = {
  ALUMNI: "Alumni",
  STAFF: "Current Staff",
  FORMER_STAFF: "Former Employee",
  FREQUENT_FLYER: "Frequent Flyer",
  ADMIN: "Administrator",
};

export default function RecommendationsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [recommendations, setRecommendations] = useState([]);
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
      const res = await fetch("/api/recommendations");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not load recommendations");
        setLoading(false);
        return;
      }

      setRecommendations(data.recommendations);
      setLoading(false);
    }

    load();
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="max-w-3xl mx-auto mt-16 p-6">Loading matches...</div>;
  }

  if (error === "Profile not found") {
    return (
      <div className="max-w-3xl mx-auto mt-16 p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Complete your profile first</h1>
        <p className="text-gray-600 mb-4">
          We need to know your skills and interests before we can suggest
          relevant mentors and connections.
        </p>
        <a href="/profile" className="underline">
          Go to my profile
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-2">Suggested for you</h1>
      <p className="text-gray-500 text-sm mb-8">
        Ranked by a blend of shared skills/interests and mentorship or
        connection activity across the platform -- the mix leans more on
        activity as more requests get accepted platform-wide.
      </p>

      {recommendations.length === 0 ? (
        <p className="text-gray-500">
          No matches yet -- add more skills and interests to your profile, or
          check back once more stakeholders have completed theirs.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {recommendations.map((r) => (
            <div
              key={r.userId}
              className="border rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{r.fullName}</p>
                  <span className="text-xs text-gray-500">
                    {ROLE_LABELS[r.role] || r.role}
                  </span>
                </div>
                {r.department && (
                  <p className="text-sm text-gray-600">{r.department}</p>
                )}
                {r.mentorshipRole && (
                  <span className="inline-block mt-1 text-xs bg-gray-100 rounded-full px-2 py-0.5">
                    {r.mentorshipRole === "BOTH"
                      ? "Mentor & Mentee"
                      : r.mentorshipRole === "MENTOR"
                      ? "Mentor"
                      : "Mentee"}
                  </span>
                )}

                {(r.sharedSkills.length > 0 || r.sharedInterests.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.sharedSkills.map((s) => (
                      <span
                        key={`skill-${s}`}
                        className="text-xs bg-black text-white rounded-full px-2 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                    {r.sharedInterests.map((i) => (
                      <span
                        key={`interest-${i}`}
                        className="text-xs border border-gray-300 rounded-full px-2 py-0.5"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-lg font-bold">{r.matchPercent}%</span>
                <span className="text-xs text-gray-400">match</span>
                <RequestActions userId={r.userId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
