import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "./databaseUrl";

describe("resolveDatabaseUrl", () => {
  it("prefers the direct (unpooled) connection", () => {
    expect(
      resolveDatabaseUrl({
        DATABASE_URL: "postgresql://pooled",
        DATABASE_URL_UNPOOLED: "postgresql://direct",
      }),
    ).toBe("postgresql://direct");
  });
  it("uses Supabase's non-pooling name", () => {
    expect(resolveDatabaseUrl({ POSTGRES_URL: "postgres://pooled", POSTGRES_URL_NON_POOLING: "postgres://direct" })).toBe("postgres://direct");
  });
  it("falls back to DATABASE_URL, then POSTGRES_URL", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "postgresql://a", POSTGRES_URL: "postgres://b" })).toBe("postgresql://a");
    expect(resolveDatabaseUrl({ POSTGRES_URL: "postgres://b" })).toBe("postgres://b");
  });
  it("skips Prisma's proxy address and takes the plain one", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "prisma+postgres://accelerate.prisma-data.net/?api_key=x", POSTGRES_URL: "postgres://db.example/postgres" })).toBe("postgres://db.example/postgres");
  });
  it("ignores empty and non-postgres values", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "  ", POSTGRES_URL: "mysql://x" })).toBeUndefined();
    expect(resolveDatabaseUrl({})).toBeUndefined();
  });
});
