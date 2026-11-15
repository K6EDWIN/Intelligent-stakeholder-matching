"use client";

import ProfileEditor from "@/components/ProfileEditor";
import StandaloneProfileShell from "@/components/StandaloneProfileShell";

export default function ProfilePage() {
  return (
    <StandaloneProfileShell>
      <ProfileEditor standalone />
    </StandaloneProfileShell>
  );
}
