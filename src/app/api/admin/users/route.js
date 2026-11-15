import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminApiErrorResponse } from "@/lib/admin-api-error";

// GET /api/admin/users
// Lists every user with their verification/suspension status. Admin-only.
export async function GET() {
  try {
    return await getAdminUsers();
  } catch (error) {
    return adminApiErrorResponse("Admin users", error);
  }
}

async function getAdminUsers() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { isDemo: false, isDeleted: false },
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,
      isSuspended: true,
      createdAt: true,
      profile: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
