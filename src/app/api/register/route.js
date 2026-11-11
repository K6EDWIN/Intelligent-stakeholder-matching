import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAppEmail } from "@/lib/gmail";
import { logActivity } from "@/lib/audit-log";
import { buildAppUrl, escapeHtml } from "@/lib/app-url";

const ALLOWED_REGISTRATION_ROLES = [
  "ALUMNI",
  "STAFF",
  "FORMER_STAFF",
  "FREQUENT_FLYER",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, role } = body;

    // 1. Required fields presence check
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "email, password, fullName, and role are all required" },
        { status: 400 }
      );
    }

    // 2. Strict Role Whitelisting (Critical Security Fix)
    if (role === "ADMIN" || !ALLOWED_REGISTRATION_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error:
            "Invalid role selected. Self-registration is strictly restricted to stakeholder personas (Alumni, Staff, Former Staff, Frequent Flyer).",
        },
        { status: 400 }
      );
    }

    // 3. Input Validation: Email
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 4. Input Validation: Full Name
    const normalizedName = typeof fullName === "string" ? fullName.trim() : "";
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return NextResponse.json(
        { error: "Full name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    // 5. Input Validation: Password strength
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password exceeds maximum allowable length of 128 characters." },
        { status: 400 }
      );
    }

    let verificationBaseUrl;
    try {
      verificationBaseUrl = buildAppUrl("/");
    } catch (error) {
      console.error("Email verification URL is not configured:", error);
      return NextResponse.json(
        { error: "Email links are not configured. Set APP_URL to the public site address and redeploy." },
        { status: 503 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const assignedDepartment =
      typeof body.department === "string" && body.department.trim()
        ? body.department.trim()
        : null;

    const assignedBio =
      typeof body.bio === "string" && body.bio.trim()
        ? body.bio.trim()
        : null;

    const assignedMentorshipRole =
      ["MENTOR", "MENTEE", "BOTH"].includes(body.mentorshipRole)
        ? body.mentorshipRole
        : null;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        profile: {
          create: {
            fullName: normalizedName,
            department: assignedDepartment,
            bio: assignedBio,
            mentorshipRole: assignedMentorshipRole,
            isPublic: false,
          },
        },
      },
      include: { profile: true },
    });

    await logActivity({
      actorId: user.id,
      actionType: "USER_REGISTERED",
      targetId: user.id,
      summary: "Created a stakeholder account",
      details: { email: normalizedEmail, role, name: normalizedName },
    });

    // Generate a verification token valid for 24 hours
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const verifyUrl = new URL("/api/auth/verify", verificationBaseUrl);
    verifyUrl.searchParams.set("token", token);
    // Security Fix: Do NOT leak sensitive verification tokens/URLs to production or server logs

    try {
      await sendAppEmail({
        to: email,
        subject: "Verify your email - Intelligent Stakeholder Matching",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Welcome, ${escapeHtml(fullName)}!</h2>
            <p>Thanks for registering. Please confirm your email address to activate your account.</p>
            <p>
              <a href="${escapeHtml(verifyUrl.toString())}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">
                Verify my email
              </a>
            </p>
            <p>Or copy this link into your browser:</p>
            <p style="word-break:break-all;color:#555;">${escapeHtml(verifyUrl.toString())}</p>
            <p>This link expires in 24 hours.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Don't fail registration if the email fails to send -- log it so
      // you can see the issue in the terminal, but still let the user know
      // their account was created.
      console.error("Failed to send verification email:", emailErr);
    }

    const { passwordHash: _omit, ...safeUser } = user;

    return NextResponse.json(
      {
        user: safeUser,
        message: "Registration successful. Check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}
