import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "./databaseUrl";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Whichever host set the connection string (Neon, Supabase, Prisma Postgres), direct connection preferred. */
export const databaseUrl = resolveDatabaseUrl();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
