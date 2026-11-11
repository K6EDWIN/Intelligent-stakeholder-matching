import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit-log";

// POST /api/feedback
// Submits a rating (1-5) and qualitative comment for a mentorship or connection session.
// Recommendation ratings are used as direct relevance labels for the ranking model.
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { mentorshipRequestId, connectionRequestId, recommendationId, rating, comment } = await request.json();

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  let recommendation = null;
  if (recommendationId) {
    recommendation = await prisma.recommendation.findFirst({
      where: { id: recommendationId, ownerId: session.user.id },
      select: { id: true, modelFeatures: true },
    });
    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found for this account" }, { status: 404 });
    }
  }

  try {
    const existing = recommendation
      ? await prisma.feedback.findFirst({ where: { userId: session.user.id, recommendationId: recommendation.id } })
      : null;
    const feedbackData = {
        userId: session.user.id,
        mentorshipRequestId: mentorshipRequestId || null,
        connectionRequestId: connectionRequestId || null,
        recommendationId: recommendation?.id || null,
        modelFeatures: recommendation?.modelFeatures || undefined,
        rating: numericRating,
        comment: comment || null,
    };
    const feedback = existing
      ? await prisma.feedback.update({ where: { id: existing.id }, data: feedbackData })
      : await prisma.feedback.create({ data: feedbackData });

    await logActivity({
      actorId: session.user.id,
      targetId: session.user.id,
      actionType: "FEEDBACK_SUBMITTED",
      summary: "Submitted a connection or mentorship rating",
      details: { rating: numericRating, mentorshipRequestId: mentorshipRequestId || null, connectionRequestId: connectionRequestId || null, recommendationId: recommendation?.id || null, commentIncluded: Boolean(comment) },
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
