function parsePublicUrl(value) {
  if (!value || typeof value !== "string") return null;

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/** Resolve the canonical origin used in links sent by email. */
export function getAppBaseUrl() {
  const isDeployed = Boolean(process.env.VERCEL_ENV) || process.env.NODE_ENV === "production";
  const isProduction = process.env.VERCEL_ENV === "production" ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");
  const candidates = isProduction
    ? [process.env.APP_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.NEXTAUTH_URL, process.env.VERCEL_URL]
    : [process.env.APP_URL, process.env.VERCEL_URL, process.env.NEXTAUTH_URL, "http://localhost:3000"];

  for (const candidate of candidates) {
    const url = parsePublicUrl(candidate);
    if (!url || (isDeployed && (url.protocol !== "https:" || isLocalHost(url.hostname)))) continue;
    return url.origin;
  }

  throw new Error("Email links need a public site URL. Set APP_URL or NEXTAUTH_URL to the deployed HTTPS address.");
}

export function buildAppUrl(pathname, searchParams = {}) {
  const url = new URL(pathname, getAppBaseUrl());
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}
