// @ts-nocheck
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI migrations should use Neon’s direct, unpooled URL.
    url: process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
  },
});
