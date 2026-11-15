"use client";

import ProfileEditor from "@/components/ProfileEditor";
import StandaloneProfileShell from "@/components/StandaloneProfileShell";

export default function ProfilePage({ standalone = true }) {
  const profile = <ProfileEditor standalone={standalone} />;
  return standalone ? (
    <StandaloneProfileShell>{profile}</StandaloneProfileShell>
  ) : (
    profile
  );
}
