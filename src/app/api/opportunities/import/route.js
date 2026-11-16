import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const CAREERS_HOST = "careers.kenya-airways.com";
const MAX_HTML_BYTES = 2 * 1024 * 1024;

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function plainText(value) {
  return decodeHtml(String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[\t\u00a0 ]+/g, " ").replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function allJobPostings(value, found = []) {
  if (!value) return found;
  if (Array.isArray(value)) {
    value.forEach((item) => allJobPostings(item, found));
  } else if (typeof value === "object") {
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.some((type) => typeof type === "string" && (type === "JobPosting" || type.endsWith("/JobPosting")))) found.push(value);
    if (value["@graph"]) allJobPostings(value["@graph"], found);
  }
  return found;
}

function parseExpiry(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const humanDate = String(value).match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(am|pm)?)?/i);
  if (!humanDate) return null;
  let hour = Number(humanDate[4] || 0);
  const meridiem = humanDate[6]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  const normalized = new Date(`${humanDate[1]} ${humanDate[2]}, ${humanDate[3]} ${hour}:${humanDate[5] || "00"}:00`);
  return Number.isNaN(normalized.getTime()) ? null : normalized;
}

function parseJobPosting(html, sourceUrl) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let posting;
  for (const [, rawJson] of scripts) {
    try {
      posting = allJobPostings(JSON.parse(decodeHtml(rawJson)))[0];
      if (posting) break;
    } catch {
      // Some career systems include unrelated or malformed JSON-LD blocks.
    }
  }

  const text = plainText(html);
  const field = (name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.match(new RegExp(`${escaped}\\s*:?\\s*([^\\n]+)`, "i"))?.[1]?.trim() || "";
  };
  const meta = (property) => {
    for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
      const name = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
      const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
      if (name?.toLowerCase() === property.toLowerCase() && content) return content;
    }
    return "";
  };
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";

  const title = String(posting?.title || field("Job Title") || meta("og:title") || plainText(documentTitle))
    .replace(/\s*[|–-]\s*Kenya Airways Careers.*$/i, "").trim();
  const structuredDescription = plainText(posting?.description);
  const overviewStart = text.search(/Job Overview/i);
  const applyStart = text.search(/How To Apply/i);
  const pageDescription = overviewStart >= 0
    ? text.slice(overviewStart, applyStart > overviewStart ? applyStart : undefined).trim()
    : plainText(meta("description"));
  const description = (structuredDescription || pageDescription).slice(0, 12000);
  if (!title || /^(Kenya Airways Careers|KQ Career Portal|Join Our Team)$/i.test(title) || !description) {
    return null;
  }

  const validThrough = posting?.validThrough || field("Expiry Date");
  const parsedExpiry = parseExpiry(validThrough);
  const expiresAt = parsedExpiry?.toISOString() || null;
  const organization = posting?.hiringOrganization?.name;
  const location = posting?.jobLocation?.address?.addressLocality
    || posting?.jobLocation?.address?.addressRegion
    || "";
  const employmentType = Array.isArray(posting?.employmentType)
    ? posting.employmentType.join(", ")
    : String(posting?.employmentType || field("Employment Type") || "").trim();
  const division = String(posting?.industry || field("Division") || "").trim();
  const details = [organization && `Organization: ${organization}`, division && `Division: ${division}`, employmentType && `Employment type: ${employmentType}`, location && `Location: ${location}`, expiresAt && `Application deadline: ${new Date(expiresAt).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}`].filter(Boolean);
  const formattedDescription = details.length ? `${description}\n\n${details.join("\n")}` : description;

  return {
    title: title.slice(0, 180),
    description: formattedDescription,
    type: /intern|graduate trainee|cadet/i.test(`${title} ${employmentType}`) ? "Internship" : "Career Opening",
    sourceUrl,
    expiresAt,
    division: division.slice(0, 120) || null,
    employmentType: employmentType.slice(0, 120) || null,
  };
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Only administrators can import official Kenya Airways job listings." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  let url;
  try {
    url = new URL(typeof body.url === "string" ? body.url : "");
  } catch {
    return NextResponse.json({ error: "Paste a Kenya Airways Careers job details link." }, { status: 400 });
  }
  if (url.protocol !== "https:" || url.hostname !== CAREERS_HOST || (url.port && url.port !== "443") || url.username || url.password || url.toString().length > 2048
    || !/^\/anonymous\/listing\/[\da-f-]{36}\/details\/?$/i.test(url.pathname)) {
    return NextResponse.json({ error: "Use a job details link from careers.kenya-airways.com." }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "PrideConnect opportunity importer" },
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
      cache: "no-store",
    });
    const finalUrl = new URL(response.url);
    if (!response.ok || response.status >= 300 || finalUrl.hostname !== CAREERS_HOST || !response.headers.get("content-type")?.includes("text/html")) {
      return NextResponse.json({ error: "The official listing could not be read. Check that it is still available, then enter its details manually." }, { status: 422 });
    }
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_HTML_BYTES) {
      return NextResponse.json({ error: "The careers page is too large to import. Enter its details manually." }, { status: 422 });
    }
    const html = await response.text();
    if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) {
      return NextResponse.json({ error: "The careers page is too large to import. Enter its details manually." }, { status: 422 });
    }
    const opportunity = parseJobPosting(html, url.toString());
    if (!opportunity) {
      return NextResponse.json({ error: "The page did not expose readable job details. Enter the listing manually and keep its official link." }, { status: 422 });
    }
    if (opportunity.expiresAt && new Date(opportunity.expiresAt) <= new Date()) {
      return NextResponse.json({ error: "This Kenya Airways listing has passed its application deadline and cannot be imported as an active opportunity." }, { status: 410 });
    }
    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("Could not import a Kenya Airways Careers listing:", error);
    return NextResponse.json({ error: "Could not reach Kenya Airways Careers right now. Try again or enter the details manually." }, { status: 502 });
  }
}
