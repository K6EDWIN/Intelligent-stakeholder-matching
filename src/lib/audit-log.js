import { prisma } from "@/lib/prisma";

/**
 * Record a human-readable activity item in the existing admin audit table.
 * `adminId` is the legacy column name; it represents the actor for all roles.
 * Audit failures are reported but never roll back the user's primary action.
 */
export async function logActivity({ actorId, actionType, summary, targetId = null, details = {} }, db = prisma) {
  if (!actorId || !actionType || !summary) return;
  try {
    const actor = await db.user.findUnique({ where: { id: actorId }, select: { role: true } });
    await db.adminAction.create({
      data: {
        adminId: actorId,
        actionType,
        targetId,
        notes: JSON.stringify({
          version: 1,
          summary,
          actorRole: actor?.role || null,
          actorType: actor?.role === "ADMIN" ? "ADMIN" : "MEMBER",
          details,
        }),
      },
    });
  } catch (error) {
    console.error("Could not write activity audit record:", error);
  }
}

export function readActivityNotes(notes, actionType) {
  if (!notes) return { summary: actionType.replaceAll("_", " ").toLowerCase(), details: {} };
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === "object") return {
      summary: parsed.summary || actionType.replaceAll("_", " ").toLowerCase(),
      details: parsed.details || {},
      ...parsed,
    };
  } catch {
    // Older audit rows used plain text notes. Preserve that text in the detail view.
  }
  return { summary: actionType.replaceAll("_", " ").toLowerCase(), details: { notes } };
}
