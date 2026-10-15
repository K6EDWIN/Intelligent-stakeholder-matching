"use client";

import { SessionProvider } from "next-auth/react";
import { ViewModeProvider } from "@/components/ViewMode";

export default function Providers({ children }) {
  return <SessionProvider><ViewModeProvider>{children}</ViewModeProvider></SessionProvider>;
}
