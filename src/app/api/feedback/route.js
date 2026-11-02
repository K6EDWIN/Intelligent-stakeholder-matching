import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit-log";

// POST /api/feedback
// Submits a rating (1-5) and qualitative comment for a mentorship or connection session.
// This interaction feeds directly back into the Collaborative Filtering matrix.
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { mentorshipRequestId, rating, comment } = await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        mentorshipRequestId: mentorshipRequestId || null,
        rating: Number(rating),
        comment: comment || null,
      },
    });

    await logActivity({
      actorId: session.user.id,
      targetId: session.user.id,
      actionType: "FEEDBACK_SUBMITTED",
      summary: "Submitted a connection or mentorship rating",
      details: { rating: Number(rating), mentorshipRequestId: mentorshipRequestId || null, commentIncluded: Boolean(comment) },
    });

    return NextResponse.json({ feedback, message: "Feedback submitted successfully" }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to record feedback: " + err.message },
      { status: 500 }
    );
  }
}

// GET /api/feedback
// Returns feedback records associated with the user.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feedbacks });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch feedback: " + err.message },
      { status: 500 }
    );
  }
}
