import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Demo role switcher. This is NOT authentication: anyone can pick any role.
 * The cookie is signed so that role and company cannot be edited by hand,
 * and every server action still checks role and ownership on the server.
 */
export type SessionRole = "SHIPPER" | "CARRIER";
export type Session = { role: SessionRole; companyId: string };

const COOKIE = "am_session";
export const DEFAULT_SHIPPER_COMPANY = "demo-shipper";
export const DEFAULT_CARRIER_COMPANY = "demo-air-a";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not set. Add it to the environment variables.");
  }
  return "dev-secret-not-for-production";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export async function setSession(session: Session): Promise<void> {
  const payload = `${session.role}.${session.companyId}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [role, companyId, sig] = parts;
  if (role !== "SHIPPER" && role !== "CARRIER") return null;
  const expected = Buffer.from(sign(`${role}.${companyId}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { role, companyId };
}

export async function requireRole(role: SessionRole): Promise<Session> {
  const session = await getSession();
  if (!session || session.role !== role) redirect("/demo");
  return session;
}

/** For server actions: returns null instead of redirecting so the action can answer with an error. */
export async function sessionFor(role: SessionRole): Promise<Session | null> {
  const session = await getSession();
  return session && session.role === role ? session : null;
}
