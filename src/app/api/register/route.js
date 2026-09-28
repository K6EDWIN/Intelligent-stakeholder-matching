import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export async function POST(request) {
  try {
    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "email, password, fullName, and role are all required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        profile: {
          create: {
            fullName,
          },
        },
      },
      include: { profile: true },
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

    const verifyUrl = `${process.env.APP_URL}/api/auth/verify?token=${token}`;
    console.log(`\n======================================================\n🔗 [EMAIL VERIFICATION LINK]:\n${verifyUrl}\n======================================================\n`);

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Verify your email - Intelligent Stakeholder Matching",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Welcome, ${fullName}!</h2>
            <p>Thanks for registering. Please confirm your email address to activate your account.</p>
            <p>
              <a href="${verifyUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">
                Verify my email
              </a>
            </p>
            <p>Or copy this link into your browser:</p>
            <p style="word-break:break-all;color:#555;">${verifyUrl}</p>
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