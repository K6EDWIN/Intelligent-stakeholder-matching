import { prisma } from "@/lib/prisma";

export async function createNotification(data) {
  try {
    return await prisma.notification.create({ data });
  } catch (error) {
    // Core request actions must remain available while a deployment is waiting
    // for the additive notifications migration to reach its database.
    console.warn("Could not save notification:", error.message);
    return null;
  }
}
