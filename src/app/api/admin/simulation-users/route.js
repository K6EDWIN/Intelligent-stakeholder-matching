import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  const users = await prisma.user.findMany({
    where: query ? {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { profile: { is: { fullName: { contains: query, mode: "insensitive" } } } },
        { profile: { is: { department: { contains: query, mode: "insensitive" } } } },
      ],
    } : {},
    select: {
      id: true,
      email: true,
      role: true,
      profile: { select: { fullName: true, department: true } },
    },
    orderBy: [{ profile: { fullName: "asc" } }, { email: "asc" }],
    take: 25,
  });
  return NextResponse.json({ users, limited: users.length === 25 });
}
