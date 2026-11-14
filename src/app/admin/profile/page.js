"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminProfileShell from "@/components/AdminProfileShell";
import ProfileEditor from "@/components/ProfileEditor";

export default function AdminProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") router.replace("/profile");
  }, [status, session?.user?.role, router]);

  if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
    return (
      <main className="admin-profile-loading" role="status">
        Loading administrator profile...
      </main>
    );
  }

  return (
    <AdminProfileShell>
      <ProfileEditor adminWorkspace />
    </AdminProfileShell>
  );
}
