"use client";

import { useRouter } from "next/navigation";
import { KQLogo } from "@/components/KQBrand";

export default function StandaloneProfileShell({ children }) {
  const router = useRouter();

  return (
    <div className="standalone-profile">
      <header className="standalone-profile-header">
        <KQLogo light />
        <button type="button" onClick={() => router.back()} className="standalone-profile-back">
          Back
        </button>
      </header>
      <main className="standalone-profile-main">{children}</main>
    </div>
  );
}
