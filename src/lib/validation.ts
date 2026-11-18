import { z } from "zod";
import { CARGO_TYPES, CITIES, modesBetween, PRICING_UNITS_BY_MODE } from "./constants";
import { parseDate, todayUtc } from "./dates";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((v) => !Number.isNaN(parseDate(v).getTime()), "Enter a valid date.");

const cityCode = (message: string) => z.enum(CITIES.map((c) => c.code) as [string, ...string[]], { error: message });
const origin = cityCode("Choose where the cargo starts.");
const destination = cityCode("Choose where the cargo goes.");

const optionalPositive = (message: string, max: number) => z.number().positive(message).max(max).nullable();

export const shipmentSchema = z
  .object({
    origin,
    destination,
    cargoKind: z.enum(["GENERAL", "VEHICLES"]),
    weightKg: z.number().max(500_000, "Weight is too large for this demo.").nullable(),
    volumeM3: z.number().max(2_000, "Volume is too large for this demo.").nullable(),
    pieces: z.number().int("Pieces must be a whole number.").min(1, "At least 1 piece.").max(100_000).nullable(),
    floorAreaM2: optionalPositive("Floor space must be more than 0 m².", 1_000),
    vehicleCount: z.number().int("Vehicles must be a whole number.").min(1, "At least 1 vehicle.").max(200, "Up to 200 vehicles in this demo.").nullable(),
    heaviestPieceKg: optionalPositive("Heaviest piece must be more than 0 kg.", 500_000),
    isDangerousGoods: z.boolean(),
    cargoType: z.enum(CARGO_TYPES, { error: "Choose a cargo type." }),
    pieceLengthCm: optionalPositive("Length must be more than 0 cm.", 2_000),
    pieceWidthCm: optionalPositive("Width must be more than 0 cm.", 2_000),
    pieceHeightCm: optionalPositive("Height must be more than 0 cm.", 2_000),
    pieceWeightKg: optionalPositive("Weight per piece must be more than 0 kg.", 50_000),
    stackable: z.boolean().default(false),
    commodity: z.string().trim().max(120, "Keep the description under 120 characters.").default(""),
    readyDate: dateStr,
    deliverBy: dateStr,
    notes: z.string().trim().max(500, "Keep notes under 500 characters.").default(""),
  })
  .superRefine((v, ctx) => {
    if (v.origin === v.destination) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "Choose a destination that is not the starting city." });
    } else if (modesBetween(v.origin, v.destination).length === 0) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "No way to send cargo between these cities in the demo." });
    }
    const dims = [v.pieceLengthCm, v.pieceWidthCm, v.pieceHeightCm, v.pieceWeightKg];
    const byPieces = dims.every((d) => d != null);
    if (v.cargoKind === "GENERAL" && dims.some((d) => d != null) && !byPieces) {
      ctx.addIssue({ code: "custom", path: ["pieceLengthCm"], message: "Enter length, width, height and weight of one piece, or switch to totals." });
    }
    if (v.cargoKind === "GENERAL" && byPieces) {
      if (v.pieces == null) ctx.addIssue({ code: "custom", path: ["pieces"], message: "Enter the number of pieces." });
    } else if (v.cargoKind === "GENERAL") {
      if (v.weightKg == null || !(v.weightKg > 0)) ctx.addIssue({ code: "custom", path: ["weightKg"], message: "Enter the total weight in kg." });
      if (v.volumeM3 == null || !(v.volumeM3 > 0)) ctx.addIssue({ code: "custom", path: ["volumeM3"], message: "Enter the total volume in m³." });
      if (v.pieces == null) ctx.addIssue({ code: "custom", path: ["pieces"], message: "Enter the number of pieces." });
      if (v.heaviestPieceKg != null && v.weightKg != null && v.heaviestPieceKg > v.weightKg) {
        ctx.addIssue({ code: "custom", path: ["heaviestPieceKg"], message: "Heaviest piece cannot be more than the total weight." });
      }
    } else if (v.vehicleCount == null) {
      ctx.addIssue({ code: "custom", path: ["vehicleCount"], message: "Enter the number of vehicles." });
    }
    const ready = parseDate(v.readyDate);
    const by = parseDate(v.deliverBy);
    if (ready < todayUtc()) ctx.addIssue({ code: "custom", path: ["readyDate"], message: "Ready date is in the past. Pick today or later." });
    if (by < ready) ctx.addIssue({ code: "custom", path: ["deliverBy"], message: "Deliver-by date must be on or after the ready date." });
  });

export type ShipmentFormInput = z.infer<typeof shipmentSchema>;

export const listingSchema = z
  .object({
    mode: z.enum(["AIR", "ROAD", "RAIL", "SEA"]),
    origin,
    destination,
    cargoKind: z.enum(["GENERAL", "VEHICLES"]),
    pricingUnit: z.enum(["PER_KG", "PER_M2", "PER_VEHICLE", "FLAT"]),
    departureDate: dateStr,
    unitPrice: z.number({ error: "Enter the price." }).min(0.01, "Price must be at least $0.01.").max(1_000_000, "That price looks too high. Check the amount."),
    availableWeightKg: z.number().min(0).max(1_000_000).nullable(),
    availableVolumeM3: z.number().min(0).max(5_000).nullable(),
    availableFloorM2: z.number().positive("Floor space must be more than 0 m².").max(5_000).nullable(),
    availableVehicles: z.number().int("Vehicle slots must be a whole number.").min(1, "At least 1 vehicle slot.").max(500).nullable(),
    transitDaysMin: z.number({ error: "Enter the fastest transit in days." }).int().min(0).max(90),
    transitDaysMax: z.number({ error: "Enter the slowest transit in days." }).int().min(0).max(90),
    equipment: z.string().trim().min(2, "Choose or enter the equipment.").max(60),
    cutoffHours: z.number({ error: "Enter the cutoff in hours." }).int().min(0).max(240),
    maxPieceKg: z.number().positive("Max piece weight must be more than 0 kg.").max(100_000).nullable(),
    acceptsDangerousGoods: z.boolean(),
    minChargeableKg: z.number().min(0).max(1_000_000),
    restrictions: z.string().trim().max(200, "Keep restrictions under 200 characters.").default(""),
  })
  .superRefine((v, ctx) => {
    if (v.transitDaysMax < v.transitDaysMin) {
      ctx.addIssue({ code: "custom", path: ["transitDaysMax"], message: "Slowest transit must be at least the fastest transit." });
    }
    if (v.origin === v.destination) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "Choose a destination that is not the starting city." });
    } else if (!modesBetween(v.origin, v.destination).includes(v.mode)) {
      ctx.addIssue({ code: "custom", path: ["mode"], message: "This mode does not run between these cities." });
    }
    if (!PRICING_UNITS_BY_MODE[v.mode].includes(v.pricingUnit)) {
      ctx.addIssue({ code: "custom", path: ["pricingUnit"], message: "This mode cannot be priced that way." });
    }
    if (v.cargoKind === "VEHICLES") {
      if (v.mode === "AIR") ctx.addIssue({ code: "custom", path: ["cargoKind"], message: "Vehicles are carried by road or rail in this demo." });
      if (v.pricingUnit !== "PER_VEHICLE") ctx.addIssue({ code: "custom", path: ["pricingUnit"], message: "Vehicles are priced per vehicle." });
      if (v.availableVehicles == null) ctx.addIssue({ code: "custom", path: ["availableVehicles"], message: "Enter how many vehicles you can carry." });
    } else {
      if (v.pricingUnit === "PER_VEHICLE") ctx.addIssue({ code: "custom", path: ["pricingUnit"], message: "Per-vehicle pricing is for vehicle carriers." });
      if (v.availableWeightKg == null || !(v.availableWeightKg > 0)) ctx.addIssue({ code: "custom", path: ["availableWeightKg"], message: "Enter the weight you can carry." });
      if (v.availableVolumeM3 == null || !(v.availableVolumeM3 > 0)) ctx.addIssue({ code: "custom", path: ["availableVolumeM3"], message: "Enter the volume you can carry." });
      if (v.maxPieceKg == null) ctx.addIssue({ code: "custom", path: ["maxPieceKg"], message: "Enter the max piece weight." });
      if (v.pricingUnit === "PER_M2" && v.availableFloorM2 == null) {
        ctx.addIssue({ code: "custom", path: ["availableFloorM2"], message: "Enter the floor space you can sell, in m²." });
      }
    }
    if (parseDate(v.departureDate) < todayUtc()) {
      ctx.addIssue({ code: "custom", path: ["departureDate"], message: "Departure is in the past. Pick today or later." });
    }
  });

export type ListingFormInput = z.infer<typeof listingSchema>;

export type ActionFail = { ok: false; error: string; fieldErrors?: Record<string, string> };
export type ActionResult = { ok: true } | ActionFail;

export function fieldErrorsFrom(error: z.ZodError): ActionFail {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "Some fields need a fix. See the marked fields.", fieldErrors };
}
