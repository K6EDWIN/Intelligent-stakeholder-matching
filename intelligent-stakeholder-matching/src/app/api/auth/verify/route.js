import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing_token", request.url)
    );
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url)
    );
  }

  if (verificationToken.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(
      new URL("/login?error=expired_token", request.url)
    );
  }

  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { isVerified: true },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.redirect(new URL("/login?verified=true", request.url));
}