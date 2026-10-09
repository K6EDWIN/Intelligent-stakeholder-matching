"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { KQLogo, Avatar } from "./KQBrand";
import { Icon } from "./KQIcons";

export default function KQAppShell({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSelect, setMobileSelect] = useState(pathname);

  const navItems = [
    { href: "/recommendations", icon: "sparkles", label: "Recommended Matches", badge: "AI" },
    { href: "/directory", icon: "directory", label: "Stakeholder Directory" },
    { href: "/requests", icon: "requests", label: "Mentorship Requests" },
    { href: "/flight-reconnect", icon: "flight", label: "Flight Reconnect" },
    { href: "/opportunities", icon: "opportunity", label: "Opportunities" },
    { href: "/events", icon: "events", label: "Events" },
    { href: "/profile", icon: "profile", label: "My Profile" },
  ];

  if (session?.user?.role === "ADMIN") {
    navItems.push({ href: "/admin", icon: "dashboard", label: "Admin Console" });
  }

  const roleLabels = {
    ALUMNI: "Pride Centre Alumni",
    STAFF: "Active Flight & Ground Staff",
    FORMER_STAFF: "Former KQ Staff",
    FREQUENT_FLYER: "Verified Frequent Flyer",
    ADMIN: "System Administrator",
  };

  const handleMobileNav = (e) => {
    const target = e.target.value;
    setMobileSelect(target);
    router.push(target);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <KQLogo />
        <nav>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
                style={{ textDecoration: "none" }}
              >
                <button
                  type="button"
                  className={isActive ? "active w-full" : "w-full"}
                  tabIndex={-1}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {item.badge && <b>{item.badge}</b>}
                </button>
              </Link>
            );
          })}
        </nav>

        {session?.user && (
          <div className="sidebar-profile">
            <Avatar name={session.user.name || session.user.email} size="sm" />
            <span>
              <b className="truncate max-w-[140px]">{session.user.name || session.user.email}</b>
              <small>{roleLabels[session.user.role] || "Verified Member"}</small>
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              className="text-gray-400 hover:text-white ml-auto p-1"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        )}
      </aside>

      <div className="shell-main">
        <header className="app-header">
          <div className="mobile-brand">
            <KQLogo compact />
            <select
              aria-label="Current screen"
              onChange={handleMobileNav}
              value={mobileSelect}
            >
              {navItems.map((n) => (
                <option key={n.href} value={n.href}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          <div className="header-right">
            <Link href="/directory" className="icon-btn" title="Search directory">
              <Icon name="search" />
            </Link>
            <Link href="/requests" className="icon-btn notify" title="Mentorship requests">
              <Icon name="bell" />
            </Link>
            {session?.user ? (
              <Link href="/profile">
                <Avatar
                  name={session.user.name || session.user.email}
                  size="sm"
                />
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Log In
              </Link>
            )}
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
