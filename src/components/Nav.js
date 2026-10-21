"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KQLogo } from "./KQBrand";

export default function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Internal app pages use KQAppShell for their sidebar and top header.
  const appRoutes = [
    "/",
    "/login",
    "/register",
    "/recommendations",
    "/directory",
    "/flight-reconnect",
    "/requests",
    "/messages",
    "/notifications",
    "/profile",
    "/opportunities",
    "/events",
    "/admin",
  ];

  if (appRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return null;
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#dce0e3]">
      <KQLogo />
      <div className="flex items-center gap-5 text-sm">
        {status === "authenticated" ? (
          <>
            <Link
              href="/recommendations"
              className="text-[#182231] hover:text-[#bb162b] font-medium"
            >
              Dashboard
            </Link>
            <span className="text-gray-400 text-xs">{session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-[#bb162b] hover:underline font-semibold text-xs"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-[#182231] hover:text-[#bb162b] font-medium"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="btn btn-primary"
              style={{ minHeight: "36px", padding: "0 14px" }}
            >
              Join Network
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
