"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAdmin } from "@/lib/adminLog";
import { seedDemoData } from "@/lib/seed";
import { isAdmin } from "@/lib/session";
import type { ActionFail, ActionResult } from "@/lib/validation";

/** Every action here checks the admin session itself. The pages being hidden is not protection. */
const fail = (error: string): ActionFail => ({ ok: false, error });
const NOT_ADMIN = fail("Log in to admin first.");
const id = z.string().min(1).max(64);

export async function setCompanySuspended(input: { companyId: string; suspended: boolean }): Promise<ActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  const parsed = z.object({ companyId: id, suspended: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail("Reload the page and try again.");

  const company = await prisma.company.findUnique({ where: { id: parsed.data.companyId } });
  if (!company || company.type === "SHIPPER") return fail("Only carriers, forwarders and agents can be suspended.");

  await prisma.company.update({ where: { id: company.id }, data: { suspendedAt: parsed.data.suspended ? new Date() : null } });
  await logAdmin({
    action: parsed.data.suspended ? "Suspended carrier" : "Reinstated carrier",
    targetType: "Company",
    targetId: company.id,
    targetName: company.name,
    detail: parsed.data.suspended ? "Its offers are hidden from shippers and it cannot add capacity." : "Its offers are visible again if it is verified.",
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setListingStatus(input: { listingId: string; status: "OPEN" | "CLOSED" }): Promise<ActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  const parsed = z.object({ listingId: id, status: z.enum(["OPEN", "CLOSED"]) }).safeParse(input);
  if (!parsed.success) return fail("Reload the page and try again.");

  const listing = await prisma.capacityListing.findUnique({ where: { id: parsed.data.listingId }, include: { carrier: { select: { name: true } } } });
  if (!listing) return fail("That listing no longer exists.");

  await prisma.capacityListing.update({ where: { id: listing.id }, data: { status: parsed.data.status } });
  await logAdmin({
    action: parsed.data.status === "CLOSED" ? "Closed listing" : "Reopened listing",
    targetType: "Listing",
    targetId: listing.id,
    targetName: `${listing.carrier.name}, ${listing.origin} to ${listing.destination}`,
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Reloads the demo records. Real accounts are not touched. */
export async function adminResetDemoData(): Promise<ActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN;
  if (process.env.ALLOW_DEMO_RESET === "false") return fail("Demo reset is switched off (ALLOW_DEMO_RESET is false).");
  await seedDemoData(prisma);
  await logAdmin({ action: "Reset demo data", targetType: "System", targetId: "demo", targetName: "Demo records", detail: "Demo records reloaded. Real accounts were not touched." });
  revalidatePath("/", "layout");
  return { ok: true };
}
