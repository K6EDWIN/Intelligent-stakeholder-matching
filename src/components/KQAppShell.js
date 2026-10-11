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

  const navSections = [
    {
      heading: "Matching & Discovery",
      items: [
        { href: "/recommendations", icon: "sparkles", label: "Smart Matches", badge: "Engine" },
        { href: "/directory", icon: "directory", label: "Stakeholder Directory" },
        { href: "/requests", icon: "requests", label: "Mentorship & Requests" },
      ],
    },
    {
      heading: "Ecosystem & Hubs",
      items: [
        { href: "/flight-reconnect", icon: "flight", label: "Flight Reconnect" },
        { href: "/opportunities", icon: "opportunity", label: "Aviation Opportunities" },
        { href: "/events", icon: "events", label: "Pride Centre Events" },
      ],
    },
    {
      heading: "Account",
      items: [
        { href: "/profile", icon: "profile", label: "My Profile" },
      ],
    },
  ];

  if (session?.user?.role === "ADMIN") {
    navSections.push({
      heading: "Administration",
      items: [
        { href: "/admin", icon: "dashboard", label: "Admin Console", badge: "Admin" },
      ],
    });
  }

  const roleLabels = {
    ALUMNI: "Pride Centre Alumni",
    STAFF: "Flight & Ground Staff",
    FORMER_STAFF: "Former KQ Staff",
    FREQUENT_FLYER: "Frequent Flyer",
    ADMIN: "System Administrator",
  };

  const allNavItems = navSections.flatMap((s) => s.items);

  const handleMobileNav = (e) => {
    const target = e.target.value;
    setMobileSelect(target);
    router.push(target);
  };

  return (
    <div className="shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <KQLogo light />

        <nav>
          {navSections.map((section, idx) => (
            <div key={idx} className="mb-2">
              <div className="sidebar-nav-heading">{section.heading}</div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon name={item.icon} size={16} />
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {session?.user && (
          <div className="sidebar-profile">
            <Avatar
              name={session.user.name || session.user.email}
              size="sm"
              role={session.user.role}
            />
            <span className="truncate">
              <b className="truncate text-white text-xs block">
                {session.user.name || session.user.email?.split("@")[0]}
              </b>
              <small className="text-[#94a3b8] text-[11px] block truncate">
                {roleLabels[session.user.role] || "Verified Member"}
              </small>
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out of PrideConnect"
              className="text-[#94a3b8] hover:text-white ml-auto p-1.5 transition rounded hover:bg-white/10"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="shell-main">
        <header className="app-header">
          {/* Mobile view brand + switcher */}
          <div className="mobile-brand">
            <KQLogo compact />
            <select
              aria-label="Navigate section"
              onChange={handleMobileNav}
              value={mobileSelect}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none"
            >
              {allNavItems.map((n) => (
                <option key={n.href} value={n.href}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Left: Enterprise Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Kenya Airways Pride Centre Network</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">Institutional Intranet</span>
          </div>

          {/* Header Action Tools */}
          <div className="header-right">
            <Link
              href="/directory"
              className="icon-btn"
              title="Search Stakeholder Directory"
            >
              <Icon name="search" size={16} />
            </Link>
            <Link
              href="/requests"
              className="icon-btn relative"
              title="Mentorship & Connection Requests"
            >
              <Icon name="bell" size={16} />
            </Link>

            {session?.user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2.5 pl-2 hover:opacity-90 transition"
              >
                <Avatar
                  name={session.user.name || session.user.email}
                  size="sm"
                  role={session.user.role}
                />
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
