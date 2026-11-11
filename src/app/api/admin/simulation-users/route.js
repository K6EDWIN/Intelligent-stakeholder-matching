import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q")?.trim() || "";
  const role = searchParams.get("role") || "ALL";
  const department = searchParams.get("department") || "ALL";
  const includeDepartments = searchParams.get("includeDepartments") === "true";
  const pageSize = 25;
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const validRoles = ["ALUMNI", "STAFF", "FORMER_STAFF", "FREQUENT_FLYER"];
  const filters = [{ role: { not: "ADMIN" } }, { isDemo: false }];
  if (validRoles.includes(role)) filters.push({ role });
  if (department !== "ALL") {
    filters.push({ profile: { is: { department: { equals: department } } } });
  }
  if (query) {
    filters.push({
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { profile: { is: { fullName: { contains: query, mode: "insensitive" } } } },
      ],
    });
  }

  const where = { AND: filters };
  const [users, total, profiles] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { fullName: true, department: true } },
      },
      orderBy: [{ profile: { fullName: "asc" } }, { email: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    includeDepartments
      ? prisma.profile.findMany({
          where: { department: { not: null }, user: { role: { not: "ADMIN" }, isDemo: false } },
          select: { department: true },
          distinct: ["department"],
          orderBy: { department: "asc" },
          take: 100,
        })
      : Promise.resolve([]),
  ]);
  return NextResponse.json({
    users,
    departments: profiles.map((profile) => profile.department).filter(Boolean),
    total,
    page,
    pageSize,
    hasPrevious: page > 1,
    hasNext: page * pageSize < total,
  });
}
