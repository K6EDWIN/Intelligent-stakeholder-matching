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
          <small style={{ color: light ? "#94a3b8" : undefined }}>STAKEHOLDER NETWORK</small>
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
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn btn-${variant} ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={onClick}
    >
      {children}
      {icon && <Icon name={icon} size={16} />}
    </button>
  );
}

export function Tag({ children, gold = false }) {
  return <span className={`tag ${gold ? "tag-gold" : ""}`}>{children}</span>;
}

export function Avatar({ name = "KQ Member", src, size = "md" }) {
  if (!src) {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <div
        className={`avatar avatar-${size} flex items-center justify-center font-bold text-white bg-[#0e2740] select-none`}
        style={{
          fontSize: size === "sm" ? "11px" : size === "lg" ? "18px" : size === "xl" ? "24px" : "14px",
        }}
      >
        {initials || "KQ"}
      </div>
    );
  }
  return <img alt={name} className={`avatar avatar-${size}`} src={src} />;
}
