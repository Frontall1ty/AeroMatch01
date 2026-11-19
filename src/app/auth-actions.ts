"use server";

import { createHash, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DEMO_EMAIL_SUFFIX, isDemoEmail, loginSchema, profileSchema, registerSchema } from "@/lib/accountSchemas";
import { dummyHash, hashPassword, verifyPassword } from "@/lib/auth";
import { cityByCode } from "@/lib/constants";
import { allow } from "@/lib/rateLimit";
import { logAdmin } from "@/lib/adminLog";
import { normalizePasscode } from "@/lib/passcode";
import {
  adminEnabled,
  endAdminSession,
  endSession,
  getSession,
  homeFor,
  isAdmin,
  startAdminSession,
  startSession,
} from "@/lib/session";
import { fieldErrorsFrom, type ActionFail, type ActionResult } from "@/lib/validation";

const fail = (error: string, fieldErrors?: Record<string, string>): ActionFail => ({ ok: false, error, fieldErrors });

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/* ---------- Register, log in, log out ---------- */

export async function registerAccount(input: unknown): Promise<ActionResult> {
  if (process.env.ALLOW_REGISTRATION === "false") {
    return fail("Registration is closed for now. Contact the team to get an account.");
  }
  const ip = await clientIp();
  if (!allow(`register:${ip}`, 6, 60 * 60 * 1000)) {
    return fail("Too many sign-ups from this connection. Try again in an hour.");
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const v = parsed.data;

  if (isDemoEmail(v.email)) {
    return fail("Some fields need a fix. See the marked fields.", { email: `Use your own email address, not one ending in ${DEMO_EMAIL_SUFFIX}.` });
  }
  const existing = await prisma.user.findUnique({ where: { email: v.email }, select: { id: true } });
  if (existing) {
    return fail("Some fields need a fix. See the marked fields.", { email: "An account with this email already exists. Log in instead." });
  }

  const city = cityByCode(v.city)!;
  const passwordHash = await hashPassword(v.password);
  try {
    const user = await prisma.user.create({
      data: {
        name: v.name,
        email: v.email,
        passwordHash,
        role: v.role,
        company: {
          create: {
            name: v.companyName,
            type: v.role === "SHIPPER" ? "SHIPPER" : "CARRIER",
            verified: false, // carriers are verified by hand by the team
            country: city.country,
            city: city.code,
          },
        },
      },
    });
    await startSession(user.id);
    redirect(v.role === "CARRIER" ? "/account?welcome=1" : homeFor("SHIPPER"));
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("Some fields need a fix. See the marked fields.", { email: "An account with this email already exists. Log in instead." });
    }
    throw error; // includes the redirect
  }
}

export async function loginAccount(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const { email, password } = parsed.data;

  const ip = await clientIp();
  if (!allow(`login-ip:${ip}`, 30, 10 * 60 * 1000) || !allow(`login:${email}`, 8, 10 * 60 * 1000)) {
    return fail("Too many attempts. Wait a few minutes and try again.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // The same work is done whether or not the email exists, and the error never says which part was wrong.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !user.passwordHash || !ok) return fail("The email or password is not correct. Check both and try again.");

  await startSession(user.id);
  redirect(homeFor(user.role));
}

export async function logout() {
  await endSession();
  redirect("/");
}

/** Demo accounts have no password. They hold invented data and are switched off with ALLOW_DEMO_ACCOUNTS=false. */
export async function demoLogin(userId: string) {
  if (process.env.ALLOW_DEMO_ACCOUNTS === "false") redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: String(userId) } });
  if (!user || !isDemoEmail(user.email) || user.passwordHash || !user.companyId.startsWith("demo-")) redirect("/demo");
  await startSession(user.id);
  redirect(homeFor(user.role));
}

/* ---------- Profile ---------- */

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Your session ended. Log in again.");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const v = parsed.data;
  const city = cityByCode(v.city)!;

  await prisma.company.update({
    where: { id: session.companyId }, // always the signed-in user's own company
    data: { city: city.code, country: city.country, phone: v.phone, address: v.address, taxId: v.taxId, website: v.website, about: v.about },
  });
  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------- Admin: verifying carriers by hand ---------- */

const hash = (s: string) => createHash("sha256").update(s).digest();

export async function adminLogin(input: unknown): Promise<ActionResult> {
  if (!adminEnabled()) return fail("Admin is switched off. Set ADMIN_PASSCODE to turn it on.");
  const parsed = z.object({ passcode: z.string().min(1, "Enter the admin passcode.").max(200) }).safeParse(input);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  if (!allow(`admin:${await clientIp()}`, 8, 10 * 60 * 1000)) return fail("Too many attempts. Wait a few minutes and try again.");
  const ok = timingSafeEqual(hash(normalizePasscode(parsed.data.passcode)), hash(normalizePasscode(process.env.ADMIN_PASSCODE)));
  if (!ok) return fail("That passcode is not correct.");

  await startAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await endAdminSession();
  redirect("/admin/login");
}

export async function setCompanyVerified(input: { companyId: string; verified: boolean }): Promise<ActionResult> {
  if (!(await isAdmin())) return fail("Log in to admin first.");
  const parsed = z.object({ companyId: z.string().min(1).max(64), verified: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("Reload the page and try again.");

  const company = await prisma.company.findUnique({ where: { id: parsed.data.companyId } });
  if (!company || company.type === "SHIPPER") return fail("Only carriers, forwarders and agents are verified.");

  await prisma.company.update({
    where: { id: company.id },
    data: { verified: parsed.data.verified, verifiedAt: parsed.data.verified ? new Date() : null },
  });
  await logAdmin({
    action: parsed.data.verified ? "Verified carrier" : "Removed verification",
    targetType: "Company",
    targetId: company.id,
    targetName: company.name,
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}
