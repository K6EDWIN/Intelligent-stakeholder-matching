import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const MAX_BANNER_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Banner uploads are not configured yet. Add a Vercel Blob store to enable them." }, { status: 503 });
  }

  let file;
  try {
    file = (await request.formData()).get("banner");
  } catch {
    return NextResponse.json({ error: "Choose a valid banner image and try again." }, { status: 400 });
  }
  if (!file || typeof file === "string" || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Choose a JPG, PNG, or WebP banner." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BANNER_BYTES) {
    return NextResponse.json({ error: "Banner images must be smaller than 4 MB." }, { status: 400 });
  }

  try {
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const blob = await put(`event-banners/${crypto.randomUUID()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Event banner upload failed:", error);
    return NextResponse.json({ error: "We could not upload that banner. Please try again." }, { status: 502 });
  }
}
