import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel's Neon integration provides a pooled DATABASE_URL and a direct DATABASE_URL_UNPOOLED.
 * The direct one is used when it exists. A demo has few connections, and it avoids pooler quirks.
 */
export const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
