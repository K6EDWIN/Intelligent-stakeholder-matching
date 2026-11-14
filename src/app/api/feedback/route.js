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

  const body = await request.json().catch(() => ({}));
  const { mentorshipRequestId, connectionRequestId, recommendationId, rating, comment } = body;

  const targetCount = [recommendationId, mentorshipRequestId, connectionRequestId]
    .filter((value) => typeof value === "string" && value.length > 0).length;
  if (targetCount !== 1) {
    return NextResponse.json(
      { error: "Rate exactly one recommendation or accepted interaction" },
      { status: 400 }
    );
  }

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  let recommendation = null;
  let mentorshipRequest = null;
  let connectionRequest = null;
  if (recommendationId) {
    recommendation = await prisma.recommendation.findFirst({
      where: { id: recommendationId, ownerId: session.user.id },
      select: { id: true, ownerId: true, modelFeatures: true },
    });
    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found for this account" }, { status: 404 });
    }
  }

  if (mentorshipRequestId) {
    mentorshipRequest = await prisma.mentorshipRequest.findUnique({ where: { id: mentorshipRequestId } });
    if (!mentorshipRequest || ![mentorshipRequest.senderId, mentorshipRequest.receiverId].includes(session.user.id)) {
      return NextResponse.json({ error: "Mentorship request not found for this account" }, { status: 404 });
    }
    if (mentorshipRequest.status !== "ACCEPTED" || !mentorshipRequest.completedAt) {
      return NextResponse.json({ error: "You can rate mentorship usefulness after it has been marked complete" }, { status: 409 });
    }
  }
  if (connectionRequestId) {
    connectionRequest = await prisma.connectionRequest.findUnique({ where: { id: connectionRequestId } });
    if (!connectionRequest || ![connectionRequest.senderId, connectionRequest.receiverId].includes(session.user.id)) {
      return NextResponse.json({ error: "Connection request not found for this account" }, { status: 404 });
    }
    if (connectionRequest.status !== "ACCEPTED") {
      return NextResponse.json({ error: "You can rate an accepted connection only" }, { status: 409 });
    }
  }
  if (!recommendation && !mentorshipRequest && !connectionRequest) {
    return NextResponse.json({ error: "Provide a recommendation or accepted interaction to rate" }, { status: 400 });
  }

  try {
    const existing = await prisma.feedback.findFirst({
      where: {
        userId: session.user.id,
        ...(recommendation ? { recommendationId: recommendation.id } : {}),
        ...(mentorshipRequest ? { mentorshipRequestId: mentorshipRequest.id } : {}),
        ...(connectionRequest ? { connectionRequestId: connectionRequest.id } : {}),
      },
    });
    const feedbackData = {
        userId: session.user.id,
        mentorshipRequestId: mentorshipRequest?.id || null,
        connectionRequestId: connectionRequest?.id || null,
        recommendationId: recommendation?.id || mentorshipRequest?.recommendationId || null,
        feedbackType: recommendation
          ? "MATCH_RELEVANCE"
          : mentorshipRequest
            ? "MENTORSHIP_USEFULNESS"
            : "CONNECTION_USEFULNESS",
        modelFeatures: mentorshipRequest?.modelFeatures || recommendation?.modelFeatures || connectionRequest?.modelFeatures || undefined,
        rating: numericRating,
        comment: comment || null,
    };
    const feedback = existing
      ? await prisma.feedback.update({ where: { id: existing.id }, data: feedbackData })
      : await prisma.feedback.create({ data: feedbackData });

    const ratedRecommendationId = recommendation?.id || mentorshipRequest?.recommendationId;
    if (ratedRecommendationId) {
      const ratedRecommendation = recommendation || await prisma.recommendation.findUnique({
        where: { id: ratedRecommendationId },
        select: { id: true, ownerId: true },
      });
      if (ratedRecommendation?.ownerId === session.user.id) {
        await prisma.recommendationEvent.create({
          data: {
            ownerId: session.user.id,
            recommendationId: ratedRecommendation.id,
            eventType: "RATED",
            scores: { rating: numericRating, feedbackType: feedbackData.feedbackType },
          },
        });
      }
    }

    await logActivity({
      actorId: session.user.id,
      targetId: session.user.id,
      actionType: "FEEDBACK_SUBMITTED",
      summary: recommendation ? "Rated recommendation relevance" : "Rated interaction usefulness",
      details: { feedbackType: feedbackData.feedbackType, rating: numericRating, mentorshipRequestId: mentorshipRequestId || null, connectionRequestId: connectionRequestId || null, recommendationId: recommendation?.id || null, commentIncluded: Boolean(comment) },
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
