import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = typeof globalThis.WebSocket === "function"
    ? globalThis.WebSocket
    : ws;
}

const connectionString = process.env.DATABASE_URL;

const adapter = connectionString?.includes("neon.tech")
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}