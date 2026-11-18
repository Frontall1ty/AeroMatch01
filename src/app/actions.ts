"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { MILESTONES } from "@/lib/constants";
import { parseDate } from "@/lib/dates";
import {
  chargeableWeight,
  evaluateAvailability,
  isVisibleToShipper,
  nextMilestone,
  statusAfterMilestones,
  totalPrice,
} from "@/lib/rules";
import { seedDemoData } from "@/lib/seed";
import {
  DEFAULT_CARRIER_COMPANY,
  DEFAULT_SHIPPER_COMPANY,
  getSession,
  sessionFor,
  setSession,
} from "@/lib/session";
import { fieldErrorsFrom, listingSchema, shipmentSchema, type ActionFail, type ActionResult } from "@/lib/validation";

const WRONG_ROLE: ActionFail = {
  ok: false,
  error: "This action needs a different role. Use the role switcher in the header, then try again.",
};
const bookingActionError = (error: string): ActionFail => ({ ok: false, error });

class ActionError extends Error {}

/* ---------- Role switcher (demo only) ---------- */

export async function switchRole(role: "SHIPPER" | "CARRIER", next?: string) {
  const current = await getSession();
  const companyId =
    role === "SHIPPER"
      ? DEFAULT_SHIPPER_COMPANY
      : current?.role === "CARRIER"
        ? current.companyId
        : DEFAULT_CARRIER_COMPANY;
  await setSession({ role, companyId });
  redirect(next ?? (role === "SHIPPER" ? "/shipper/new" : "/carrier/capacity/new"));
}

export async function switchCarrierCompany(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || company.type === "SHIPPER") return;
  await setSession({ role: "CARRIER", companyId });
  revalidatePath("/", "layout");
}

/* ---------- Shipper ---------- */

export async function createShipment(input: unknown): Promise<ActionResult> {
  const session = await sessionFor("SHIPPER");
  if (!session) return WRONG_ROLE;

  const parsed = shipmentSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const v = parsed.data;

  const created = await prisma.shipmentRequest.create({
    data: {
      shipperCompanyId: session.companyId,
      origin: "TAS",
      destination: v.destination,
      weightKg: v.weightKg,
      volumeM3: v.volumeM3,
      pieces: v.pieces,
      heaviestPieceKg: v.heaviestPieceKg,
      isDangerousGoods: v.isDangerousGoods,
      cargoType: v.cargoType,
      commodity: v.commodity,
      readyDate: parseDate(v.readyDate),
      deliverBy: parseDate(v.deliverBy),
      notes: v.notes,
    },
  });
  redirect(`/shipper/compare/${created.id}`);
}

export async function requestBooking(input: { shipmentId: string; listingId: string }): Promise<ActionResult> {
  const session = await sessionFor("SHIPPER");
  if (!session) return WRONG_ROLE;

  const shipment = await prisma.shipmentRequest.findUnique({ where: { id: String(input.shipmentId) } });
  if (!shipment || shipment.shipperCompanyId !== session.companyId) {
    return bookingActionError("We could not find that shipment. Create it again from New shipment.");
  }

  const listing = await prisma.capacityListing.findUnique({
    where: { id: String(input.listingId) },
    include: { carrier: true },
  });
  if (!listing || !isVisibleToShipper({ ...listing, carrierVerified: listing.carrier.verified }, shipment)) {
    return bookingActionError("This offer is no longer available. Go back to the comparison and pick another.");
  }

  const availability = evaluateAvailability(shipment, listing);
  if (availability.status !== "OK") {
    return bookingActionError(`This offer does not fit your shipment: ${availability.reasons[0].text}.`);
  }

  const duplicate = await prisma.booking.findFirst({
    where: {
      shipmentRequestId: shipment.id,
      listingId: listing.id,
      status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] },
    },
  });
  if (duplicate) {
    redirect(`/shipper/bookings/${duplicate.id}`);
  }

  const charge = chargeableWeight({
    mode: listing.mode,
    weightKg: shipment.weightKg,
    volumeM3: shipment.volumeM3,
    minChargeableKg: listing.minChargeableKg,
  });
  const booking = await prisma.booking.create({
    data: {
      shipmentRequestId: shipment.id,
      listingId: listing.id,
      chargeableWeightKg: charge.chargedKg,
      totalPrice: totalPrice(charge.chargedKg, listing.pricePerChargeableKg),
      status: "REQUESTED",
    },
  });
  revalidatePath("/carrier/requests");
  redirect(`/shipper/bookings/${booking.id}?requested=1`);
}

/* ---------- Carrier ---------- */

export async function createListing(input: unknown): Promise<ActionResult> {
  const session = await sessionFor("CARRIER");
  if (!session) return WRONG_ROLE;

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const v = parsed.data;

  await prisma.capacityListing.create({
    data: {
      carrierCompanyId: session.companyId, // never taken from the client
      mode: v.mode,
      origin: "TAS",
      destination: v.destination,
      departureDate: parseDate(v.departureDate),
      availableWeightKg: v.availableWeightKg,
      availableVolumeM3: v.availableVolumeM3,
      pricePerChargeableKg: v.pricePerChargeableKg,
      currency: "USD",
      transitDaysMin: v.transitDaysMin,
      transitDaysMax: v.transitDaysMax,
      equipment: v.equipment,
      cutoffHours: v.cutoffHours,
      maxPieceKg: v.maxPieceKg,
      acceptsDangerousGoods: v.acceptsDangerousGoods,
      minChargeableKg: v.minChargeableKg,
      restrictions: v.restrictions,
      status: "OPEN",
      isDemo: true,
    },
  });
  revalidatePath("/carrier/capacity/new");
  redirect("/carrier/capacity/new?published=1");
}

const bookingIdSchema = z.object({ bookingId: z.string().min(1).max(64) });

export async function approveBooking(input: unknown): Promise<ActionResult> {
  const session = await sessionFor("CARRIER");
  if (!session) return WRONG_ROLE;
  const parsed = bookingIdSchema.safeParse(input);
  if (!parsed.success) return bookingActionError("Missing booking. Reload the page and try again.");

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { listing: true, shipment: true },
  });
  if (!booking || booking.listing.carrierCompanyId !== session.companyId) {
    return bookingActionError("This request belongs to another carrier. Switch company in the header to handle it.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Only one approval can win: the status check and the update are one statement.
      const claimed = await tx.booking.updateMany({
        where: { id: booking.id, status: "REQUESTED" },
        data: { status: "CONFIRMED" },
      });
      if (claimed.count === 0) throw new ActionError("This request was already handled. Reload the page.");

      // Capacity check and decrement in one statement, so two approvals cannot overbook.
      const reserved = await tx.capacityListing.updateMany({
        where: {
          id: booking.listingId,
          status: "OPEN",
          availableWeightKg: { gte: booking.shipment.weightKg },
          availableVolumeM3: { gte: booking.shipment.volumeM3 },
        },
        data: {
          availableWeightKg: { decrement: booking.shipment.weightKg },
          availableVolumeM3: { decrement: booking.shipment.volumeM3 },
        },
      });
      if (reserved.count === 0) {
        throw new ActionError("Not enough capacity is left on this listing. Reject the request or add capacity.");
      }

      const after = await tx.capacityListing.findUniqueOrThrow({ where: { id: booking.listingId } });
      if (after.availableWeightKg <= 0 || after.availableVolumeM3 <= 0) {
        await tx.capacityListing.update({ where: { id: after.id }, data: { status: "FULL" } });
      }

      await tx.bookingEvent.create({
        data: { bookingId: booking.id, milestone: MILESTONES[booking.listing.mode][0].label },
      });
    });
  } catch (e) {
    if (e instanceof ActionError) return bookingActionError(e.message);
    throw e;
  }

  revalidatePath("/carrier/requests");
  revalidatePath("/carrier/bookings");
  return { ok: true };
}

export async function rejectBooking(input: unknown): Promise<ActionResult> {
  const session = await sessionFor("CARRIER");
  if (!session) return WRONG_ROLE;
  const parsed = bookingIdSchema.extend({ reason: z.string().trim().max(200).default("") }).safeParse(input);
  if (!parsed.success) return bookingActionError("Keep the reason under 200 characters.");

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { listing: true },
  });
  if (!booking || booking.listing.carrierCompanyId !== session.companyId) {
    return bookingActionError("This request belongs to another carrier. Switch company in the header to handle it.");
  }
  const updated = await prisma.booking.updateMany({
    where: { id: booking.id, status: "REQUESTED" },
    data: { status: "REJECTED", rejectionReason: parsed.data.reason || null },
  });
  if (updated.count === 0) return bookingActionError("This request was already handled. Reload the page.");

  revalidatePath("/carrier/requests");
  return { ok: true };
}

export async function advanceMilestone(input: unknown): Promise<ActionResult> {
  const session = await sessionFor("CARRIER");
  if (!session) return WRONG_ROLE;
  const parsed = bookingIdSchema.extend({ note: z.string().trim().max(200).default("") }).safeParse(input);
  if (!parsed.success) return bookingActionError("Keep the note under 200 characters.");

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { listing: true, events: true },
  });
  if (!booking || booking.listing.carrierCompanyId !== session.companyId) {
    return bookingActionError("This booking belongs to another carrier. Switch company in the header to update it.");
  }
  if (booking.status !== "CONFIRMED" && booking.status !== "IN_PROGRESS") {
    return bookingActionError("Only approved bookings that are not yet delivered can be updated.");
  }

  const mode = booking.listing.mode;
  const next = nextMilestone(mode, booking.events.length);
  if (!next) return bookingActionError("All milestones are already recorded.");

  try {
    await prisma.$transaction(async (tx) => {
      // The unique (bookingId, milestone) index makes a double click fail instead of duplicating.
      await tx.bookingEvent.create({
        data: { bookingId: booking.id, milestone: next.label, note: parsed.data.note },
      });
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: statusAfterMilestones(mode, booking.events.length + 1) },
      });
    });
  } catch {
    return bookingActionError("This milestone was already recorded. Reload the page.");
  }

  revalidatePath("/carrier/bookings");
  revalidatePath(`/shipper/bookings/${booking.id}`);
  return { ok: true };
}

/* ---------- Demo housekeeping ---------- */

export async function resetDemoData() {
  if (process.env.ALLOW_DEMO_RESET === "false") return;
  await seedDemoData(prisma);
  revalidatePath("/", "layout");
  redirect("/");
}
