"use client";

import Link from "next/link";
import { Icon } from "./KQIcons";

export function KQLogo({ compact = false, light = false }) {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark">
        <span>KQ</span>
      </span>
      {!compact && (
        <span className="logo-copy">
          <b style={{ color: light ? "#ffffff" : undefined }}>KQ PrideConnect</b>
          <small style={{ color: light ? "#94a3b8" : undefined }}>Kenya Airways Stakeholder Network</small>
        </span>
      )}
    </Link>
  );
}

export function Button({
  children,
  className = "",
  icon,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  size = "md",
}) {
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn btn-${variant} ${sizeClass} ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={onClick}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

export function Tag({ children, gold = false, crimson = false, emerald = false, className = "" }) {
  let variantClass = "";
  if (gold) variantClass = "tag-gold";
  else if (crimson) variantClass = "tag-crimson";
  else if (emerald) variantClass = "tag-emerald";

  return <span className={`tag ${variantClass} ${className}`}>{children}</span>;
}

export function Avatar({ name = "KQ Member", src, size = "md", role }) {
  const initials = (name || "KQ Member")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Role accent colors for authentic airline directory feel
  const roleColors = {
    STAFF: "bg-[#0e2740] text-white", // KQ Midnight
    ALUMNI: "bg-[#c8102e] text-white", // KQ Crimson
    FREQUENT_FLYER: "bg-[#c59b27] text-white", // Gold
    FORMER_STAFF: "bg-[#334155] text-white", // Slate
    ADMIN: "bg-[#0f172a] text-white",
  };

  const bgClass = role ? roleColors[role] || "bg-[#0e2740] text-white" : "bg-[#0e2740] text-white";

  if (!src) {
    return (
      <div
        className={`avatar avatar-${size} flex items-center justify-center font-bold select-none ${bgClass}`}
        style={{
          fontSize: size === "sm" ? "12px" : size === "lg" ? "16px" : size === "xl" ? "22px" : "13px",
        }}
        title={name}
      >
        {initials || "KQ"}
      </div>
    );
  }

  return (
    <img
      alt={name}
      className={`avatar avatar-${size} border border-slate-200`}
      src={src}
    />
  );
}
