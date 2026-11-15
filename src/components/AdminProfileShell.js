"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Avatar, KQLogo } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import { ViewModeToggle } from "@/components/ViewMode";

export default function AdminProfileShell({ children }) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="admin-profile-workspace">
      <header className="admin-profile-header">
        <button type="button" onClick={() => router.back()} className="admin-profile-back">
          Back
        </button>
        <Link href="/admin" className="admin-profile-brand" aria-label="Return to PrideConnect admin console">
          <KQLogo light />
          <span className="admin-profile-brand-copy">
            <b>KQ PrideConnect</b>
            <small>Administrator workspace</small>
          </span>
        </Link>

        <div className="admin-profile-header-actions">
          <ViewModeToggle compact />
          <span className="admin-profile-identity">
            <Avatar name={session?.user?.name || session?.user?.email} src={session?.user?.image} userId={session?.user?.id} size="sm" role="ADMIN" />
            <span>{session?.user?.name || session?.user?.email}</span>
          </span>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="admin-profile-logout">
            <Icon name="logout" size={14} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <nav className="admin-profile-nav" aria-label="Administrator navigation">
        <Link href="/admin" className="admin-profile-nav-link">
          <Icon name="dashboard" size={15} />
          <span>Operations console</span>
        </Link>
        <span className="admin-profile-nav-current" aria-current="page">
          <Icon name="profile" size={15} />
          <span>Administrator profile</span>
        </span>
        <Link href="/recommendations" className="admin-profile-nav-link">
          <Icon name="sparkles" size={15} />
          <span>Stakeholder portal</span>
        </Link>
      </nav>

      <main className="admin-profile-main">{children}</main>
    </div>
  );
}
