"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Nav() {
  const { data: session, status } = useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-semibold">
        ISM
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {status === "authenticated" ? (
          <>
            <Link href="/recommendations" className="underline">
              Matches
            </Link>
            <Link href="/directory" className="underline">
              Directory
            </Link>
            <Link href="/requests" className="underline">
              Requests
            </Link>
            <Link href="/opportunities" className="underline">
              Opportunities
            </Link>
            <Link href="/events" className="underline">
              Events
            </Link>
            <Link href="/profile" className="underline">
              My Profile
            </Link>
            <span className="text-gray-500">{session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="underline"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="underline">
              Log in
            </Link>
            <Link href="/register" className="underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
