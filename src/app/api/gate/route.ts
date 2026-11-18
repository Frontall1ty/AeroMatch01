import { createHash, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory throttle: 8 attempts per minute per IP (per server instance).
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooMany(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 8;
}

export async function POST(req: NextRequest) {
  const passcode = process.env.DEMO_PASSCODE;
  const back = (query: string) => NextResponse.redirect(new URL(`/gate${query}`, req.url), 303);
  if (!passcode) return NextResponse.redirect(new URL("/", req.url), 303);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(ip)) return back("?error=wait");

  const form = await req.formData();
  const given = String(form.get("passcode") ?? "");
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(passcode).digest();
  if (!timingSafeEqual(a, b)) return back("?error=wrong");

  const token = createHash("sha256")
    .update(`${passcode}:${process.env.SESSION_SECRET ?? "dev"}`)
    .digest("hex");
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set("am_gate", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
