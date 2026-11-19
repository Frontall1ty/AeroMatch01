"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { MILESTONES, SAFETY_BY_MODE } from "@/lib/constants";
import { parseDate } from "@/lib/dates";
import { totalsFromPieces } from "@/lib/fit";
import {
  evaluateAvailability,
  floorAreaOf,
  isVisibleToShipper,
  nextMilestone,
  priceFor,
  statusAfterMilestones,
  vehicleEstimate,
} from "@/lib/rules";
import { seedDemoData } from "@/lib/seed";
import { getSession, isAdmin, sessionFor } from "@/lib/session";
import { fieldErrorsFrom, listingSchema, shipmentSchema, type ActionFail, type ActionResult } from "@/lib/validation";

const WRONG_ROLE: ActionFail = {
  ok: false,
  error: "This action needs a different role. Use the role switcher in the header, then try again.",
};
const bookingActionError = (error: string): ActionFail => ({ ok: false, error });

class ActionError extends Error {}

/* ---------- Shipper ---------- */

export async function createShipment(input: unknown): Promise<ActionResult> {
  const session = await sessionFor("SHIPPER");
  if (!session) return WRONG_ROLE;

  const parsed = shipmentSchema.safeParse(input);
  if (!parsed.success) return fieldErrorsFrom(parsed.error);
  const v = parsed.data;

  const vehicles = v.cargoKind === "VEHICLES";
  const estimate = vehicles ? vehicleEstimate(v.vehicleCount ?? 0) : null;

  // When the shipper describes one piece, the totals are always recomputed here, never taken from the client.
  const byPieces =
    !vehicles &&
    v.pieces != null &&
    v.pieceLengthCm != null &&
    v.pieceWidthCm != null &&
    v.pieceHeightCm != null &&
    v.pieceWeightKg != null;
  const piece = byPieces
    ? {
        lengthCm: v.pieceLengthCm!,
        widthCm: v.pieceWidthCm!,
        heightCm: v.pieceHeightCm!,
        weightKg: v.pieceWeightKg!,
        stackable: v.stackable,
      }
    : null;
  const totals = piece ? totalsFromPieces(v.pieces!, piece) : null;

  const created = await prisma.shipmentRequest.create({
    data: {
      shipperCompanyId: session.companyId,
      origin: v.origin,
      destination: v.destination,
      cargoKind: v.cargoKind,
      weightKg: estimate ? estimate.weightKg : totals ? totals.weightKg : (v.weightKg ?? 0),
      volumeM3: estimate ? estimate.volumeM3 : totals ? totals.volumeM3 : (v.volumeM3 ?? 0),
      pieces: vehicles ? (v.vehicleCount ?? 1) : (v.pieces ?? 1),
      floorAreaM2: vehicles ? null : totals ? totals.floorAreaM2 : v.floorAreaM2,
      pieceLengthCm: piece ? Math.round(piece.lengthCm) : null,
      pieceWidthCm: piece ? Math.round(piece.widthCm) : null,
      pieceHeightCm: piece ? Math.round(piece.heightCm) : null,
      pieceWeightKg: piece ? piece.weightKg : null,
      stackable: piece ? piece.stackable : false,
      vehicleCount: vehicles ? v.vehicleCount : null,
      heaviestPieceKg: vehicles ? null : totals ? totals.heaviestPieceKg : v.heaviestPieceKg,
      isDangerousGoods: vehicles ? false : v.isDangerousGoods,
      cargoType: v.cargoType,
      commodity: v.commodity || (vehicles ? "Vehicles" : "General cargo"),
      readyDate: parseDate(v.readyDate),
      deliverBy: parseDate(v.deliverBy),
      notes: v.notes,
    },
  });
  // The way the shipper picked first only decides which mode the comparison opens on.
  const preferred = z.enum(["AIR", "SEA", "RAIL", "ROAD"]).safeParse((input as { preferredMode?: unknown } | null)?.preferredMode);
  redirect(`/shipper/compare/${created.id}${preferred.success ? `?mode=${preferred.data}` : ""}`);
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
  if (!listing || !isVisibleToShipper({ ...listing, carrierVerified: listing.carrier.verified, carrierSuspended: Boolean(listing.carrier.suspendedAt) }, shipment)) {
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

  // Price is always computed here, from the listing and the shipment. The client never sends it.
  const price = priceFor({
    mode: listing.mode,
    pricingUnit: listing.pricingUnit,
    unitPrice: listing.unitPrice,
    minChargeableKg: listing.minChargeableKg,
    shipment,
  });
  const booking = await prisma.booking.create({
    data: {
      shipmentRequestId: shipment.id,
      listingId: listing.id,
      chargeableWeightKg: price.chargedKg,
      totalPrice: price.total,
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

  const company = await prisma.company.findUnique({ where: { id: session.companyId }, select: { suspendedAt: true } });
  if (company?.suspendedAt) return bookingActionError("This account is suspended, so it cannot add capacity. Contact the AeroMatch team.");

  await prisma.capacityListing.create({
    data: {
      carrierCompanyId: session.companyId, // never taken from the client
      mode: v.mode,
      origin: v.origin,
      destination: v.destination,
      departureDate: parseDate(v.departureDate),
      cargoKind: v.cargoKind,
      pricingUnit: v.pricingUnit,
      unitPrice: v.unitPrice,
      availableWeightKg: v.cargoKind === "VEHICLES" ? 0 : (v.availableWeightKg ?? 0),
      availableVolumeM3: v.cargoKind === "VEHICLES" ? 0 : (v.availableVolumeM3 ?? 0),
      availableFloorM2: v.cargoKind === "VEHICLES" ? null : v.availableFloorM2,
      availableVehicles: v.cargoKind === "VEHICLES" ? v.availableVehicles : null,
      currency: "USD",
      transitDaysMin: v.transitDaysMin,
      transitDaysMax: v.transitDaysMax,
      equipment: v.equipment,
      cutoffHours: v.cutoffHours,
      maxPieceKg: v.maxPieceKg ?? 3000,
      acceptsDangerousGoods: v.cargoKind === "VEHICLES" ? false : v.acceptsDangerousGoods,
      minChargeableKg: v.pricingUnit === "PER_KG" ? v.minChargeableKg : 0,
      restrictions: v.restrictions,
      safetyScore: SAFETY_BY_MODE[v.mode],
      capacityWeightKg: v.cargoKind === "VEHICLES" ? null : v.availableWeightKg,
      capacityVehicles: v.cargoKind === "VEHICLES" ? v.availableVehicles : null,
      status: "OPEN",
      isDemo: true,
    },
  });
  revalidatePath("/carrier/capacity/new");
  redirect("/carrier/capacity/new?published=1");
}

const listingStatusSchema = z.object({ listingId: z.string().min(1).max(64), status: z.enum(["OPEN", "CLOSED"]) });

/** A carrier takes one of its own listings off the comparison, or puts it back. Other carriers' listings are refused. */
export async function setOwnListingStatus(input: unknown): Promise<ActionResult> {
  const session = await sessionFor("CARRIER");
  if (!session) return WRONG_ROLE;
  const parsed = listingStatusSchema.safeParse(input);
  if (!parsed.success) return bookingActionError("Reload the page and try again.");

  const listing = await prisma.capacityListing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing || listing.carrierCompanyId !== session.companyId) return bookingActionError("This listing belongs to another carrier.");

  await prisma.capacityListing.update({ where: { id: listing.id }, data: { status: parsed.data.status } });
  revalidatePath("/carrier/capacity");
  return { ok: true };
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
      // What counts as capacity depends on the listing: vehicle slots, or weight and volume
      // (and floor space when the carrier sells it).
      const s = booking.shipment;
      const l = booking.listing;
      const sellsFloor = l.cargoKind === "GENERAL" && l.availableFloorM2 != null;
      const floorNeeded = floorAreaOf(s);
      const reserved = await tx.capacityListing.updateMany({
        where:
          l.cargoKind === "VEHICLES"
            ? { id: l.id, status: "OPEN", availableVehicles: { gte: s.vehicleCount ?? 0 } }
            : {
                id: l.id,
                status: "OPEN",
                availableWeightKg: { gte: s.weightKg },
                availableVolumeM3: { gte: s.volumeM3 },
                ...(sellsFloor ? { availableFloorM2: { gte: floorNeeded } } : {}),
              },
        data:
          l.cargoKind === "VEHICLES"
            ? { availableVehicles: { decrement: s.vehicleCount ?? 0 } }
            : {
                availableWeightKg: { decrement: s.weightKg },
                availableVolumeM3: { decrement: s.volumeM3 },
                ...(sellsFloor ? { availableFloorM2: { decrement: floorNeeded } } : {}),
              },
      });
      if (reserved.count === 0) {
        throw new ActionError("Not enough capacity is left on this listing. Reject the request or add capacity.");
      }

      const after = await tx.capacityListing.findUniqueOrThrow({ where: { id: l.id } });
      const exhausted =
        after.cargoKind === "VEHICLES"
          ? (after.availableVehicles ?? 0) <= 0
          : after.availableWeightKg <= 0 ||
            after.availableVolumeM3 <= 0 ||
            (after.availableFloorM2 != null && after.availableFloorM2 <= 0);
      if (exhausted) {
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
  // Only someone who is logged in (or the admin) can reset. It only touches demo records.
  if (!(await getSession()) && !(await isAdmin())) return;
  await seedDemoData(prisma);
  revalidatePath("/", "layout");
  redirect("/");
}
