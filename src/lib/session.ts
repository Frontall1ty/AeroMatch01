import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { isDemoEmail } from "./accountSchemas";
import { normalizePasscode } from "./passcode";

/**
 * The cookie holds only a signed user id. Role and company are read from the database on every
 * request, so editing the cookie cannot change who you are. Every server action checks the role
 * and ownership again.
 */
export type SessionRole = "SHIPPER" | "CARRIER";
export type Session = {
  userId: string;
  role: SessionRole;
  companyId: string;
  name: string;
  email: string | null;
  companyName: string;
  city: string | null;
  verified: boolean;
  isDemo: boolean;
};

const COOKIE = "am_session";
const ADMIN_COOKIE = "am_admin";
const MAX_AGE = 60 * 60 * 24 * 14;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not set. Add it to the environment variables.");
  }
  return "dev-secret-not-for-production";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

const cookieOptions = (maxAge: number) =>
  ({ httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge }) as const;

export async function startSession(userId: string): Promise<void> {
  (await cookies()).set(COOKIE, `${userId}.${sign(userId)}`, cookieOptions(MAX_AGE));
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null. Cached for the length of one request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const userId = raw.slice(0, dot);
  const expected = Buffer.from(sign(userId));
  const given = Buffer.from(raw.slice(dot + 1));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
  if (!user) return null;
  return {
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    companyName: user.company.name,
    city: user.company.city,
    verified: user.company.verified,
    isDemo: isDemoEmail(user.email),
  };
});

export const homeFor = (role: SessionRole) => (role === "SHIPPER" ? "/shipper/new" : "/carrier/capacity/new");

/** For pages: send people who are not signed in to the login page, and others to their own home. */
export async function requireRole(role: SessionRole): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect(homeFor(session.role));
  return session;
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** For server actions: returns null instead of redirecting so the action can answer with an error. */
export async function sessionFor(role: SessionRole): Promise<Session | null> {
  const session = await getSession();
  return session && session.role === role ? session : null;
}

/* ---------- Admin: a separate passcode, not an account ---------- */

/** Admin is switched on by setting ADMIN_PASSCODE. It never depends on who registered. */
export const adminEnabled = () => Boolean(normalizePasscode(process.env.ADMIN_PASSCODE));

const adminToken = () =>
  createHash("sha256").update(`admin:${normalizePasscode(process.env.ADMIN_PASSCODE)}:${secret()}`).digest("hex");

export async function startAdminSession(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, adminToken(), cookieOptions(60 * 60 * 8));
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const given = Buffer.from((await cookies()).get(ADMIN_COOKIE)?.value ?? "");
  const expected = Buffer.from(adminToken());
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
