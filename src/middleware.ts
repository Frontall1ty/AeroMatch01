import { NextResponse, type NextRequest } from "next/server";
import { normalizePasscode } from "@/lib/passcode";

/** Optional passcode gate for shared demo links. Off unless DEMO_PASSCODE is set. */
export const GATE_COOKIE = "am_gate";

async function gateToken(passcode: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${passcode}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const passcode = normalizePasscode(process.env.DEMO_PASSCODE);
  if (!passcode) return NextResponse.next();

  const { pathname } = req.nextUrl;
  // The gate page is read-only (GET). Server actions and other POSTs must never pass through it.
  if (pathname === "/gate" && req.method === "GET" && !req.headers.has("next-action")) return NextResponse.next();
  if (pathname === "/api/gate" && req.method === "POST") return NextResponse.next();

  const expected = await gateToken(passcode, process.env.SESSION_SECRET ?? "dev");
  if (req.cookies.get(GATE_COOKIE)?.value === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
