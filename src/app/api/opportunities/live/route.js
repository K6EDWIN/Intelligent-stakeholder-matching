import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const CAREERS_URL = "https://careers.kenya-airways.com/anonymous/findjob";
const LISTING_PATH = /\/anonymous\/listing\/[\da-f-]{36}\/details(?:\?[^\s"'<>]*)?/ig;

function textFromHtml(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/[\t\u00a0 ]+/g, " ").replace(/\n\s+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function jobDetails(html, sourceUrl) {
  const text = textFromHtml(html);
  const field = (label) => {
    const index = text.search(new RegExp(label, "i"));
    if (index < 0) return "";
    return text.slice(index + label.length).split("\n").map((line) => line.trim()).find(Boolean) || "";
  };
  const title = field("Job Title") || text.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
  const overviewStart = text.search(/Job Overview/i);
  const applyStart = text.search(/How To Apply/i);
  const description = overviewStart >= 0
    ? text.slice(overviewStart, applyStart > overviewStart ? applyStart : undefined).trim()
    : text.slice(0, 5000);
  const expiryRaw = field("Expiry Date");
  const expiry = expiryRaw ? new Date(expiryRaw) : null;
  const expiresAt = expiry && !Number.isNaN(expiry.getTime()) ? expiry.toISOString() : null;
  if (!title || !description || /^(KQ Career Portal|Kenya Airways Careers)$/i.test(title)) return null;
  if (expiresAt && new Date(expiresAt) <= new Date()) return null;
  const division = field("Division");
  const employmentType = field("Employment Type");
  return {
    id: `kq-${sourceUrl.match(/[\da-f-]{36}/i)?.[0] || encodeURIComponent(sourceUrl)}`,
    title: title.slice(0, 180),
    description: description.slice(0, 12000),
    type: /intern|graduate trainee|cadet/i.test(`${title} ${employmentType}`) ? "Internship" : "Career Opening",
    sourceUrl,
    expiresAt,
    division: division || null,
    employmentType: employmentType || null,
    postedBy: { profile: { fullName: "Kenya Airways Careers" } },
    liveSource: true,
  };
}

async function fetchCachedHtml(url) {
  const response = await fetch(url, {
    headers: { Accept: "text/html", "User-Agent": "PrideConnect opportunity feed" },
    signal: AbortSignal.timeout(10_000),
    redirect: "manual",
    next: { revalidate: 300 },
  });
  if (!response.ok || response.status >= 300 || !response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Careers site did not return a readable listing page");
  }
  const html = await response.text();
  if (new TextEncoder().encode(html).byteLength > 2 * 1024 * 1024) throw new Error("Careers page exceeded the import size limit");
  return html;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const listingHtml = await fetchCachedHtml(CAREERS_URL);
    const links = [...new Set([...listingHtml.matchAll(LISTING_PATH)].map(([path]) => new URL(path, CAREERS_URL).toString()))].slice(0, 20);
    const listings = await Promise.all(links.map(async (url) => {
      try {
        const html = await fetchCachedHtml(url);
        return jobDetails(html, url);
      } catch (error) {
        console.warn("Could not read one Kenya Airways Careers listing:", error);
        return null;
      }
    }));
    return NextResponse.json({ opportunities: listings.filter(Boolean), source: "Kenya Airways Careers", refreshedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Kenya Airways Careers feed could not be refreshed:", error);
    return NextResponse.json({ error: "Kenya Airways Careers is temporarily unavailable. Previously saved opportunities remain available." }, { status: 502 });
  }
}
