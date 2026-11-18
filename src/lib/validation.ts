import { z } from "zod";
import { CARGO_TYPES, DESTINATIONS, MODES_BY_DESTINATION } from "./constants";
import { parseDate, todayUtc } from "./dates";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((v) => !Number.isNaN(parseDate(v).getTime()), "Enter a valid date.");

const destination = z.enum(DESTINATIONS.map((d) => d.code) as [string, ...string[]], {
  error: "Choose Istanbul, Dubai or Almaty.",
});

export const shipmentSchema = z
  .object({
    destination,
    weightKg: z.number({ error: "Enter the total weight in kg." }).positive("Weight must be more than 0 kg.").max(500_000, "Weight is too large for this demo."),
    volumeM3: z.number({ error: "Enter the total volume in m³." }).positive("Volume must be more than 0 m³.").max(2_000, "Volume is too large for this demo."),
    pieces: z.number({ error: "Enter the number of pieces." }).int("Pieces must be a whole number.").min(1, "At least 1 piece.").max(100_000),
    heaviestPieceKg: z.number().positive("Heaviest piece must be more than 0 kg.").nullable(),
    isDangerousGoods: z.boolean(),
    cargoType: z.enum(CARGO_TYPES, { error: "Choose a cargo type." }),
    commodity: z.string().trim().min(2, "Describe the goods, for example: cotton garments in cartons.").max(120, "Keep the description under 120 characters."),
    readyDate: dateStr,
    deliverBy: dateStr,
    notes: z.string().trim().max(500, "Keep notes under 500 characters.").default(""),
  })
  .superRefine((v, ctx) => {
    if (v.heaviestPieceKg != null && v.heaviestPieceKg > v.weightKg) {
      ctx.addIssue({ code: "custom", path: ["heaviestPieceKg"], message: "Heaviest piece cannot be more than the total weight." });
    }
    const ready = parseDate(v.readyDate);
    const by = parseDate(v.deliverBy);
    if (ready < todayUtc()) ctx.addIssue({ code: "custom", path: ["readyDate"], message: "Ready date is in the past. Pick today or later." });
    if (by < ready) ctx.addIssue({ code: "custom", path: ["deliverBy"], message: "Deliver-by date must be on or after the ready date." });
  });

export type ShipmentFormInput = z.infer<typeof shipmentSchema>;

export const listingSchema = z
  .object({
    mode: z.enum(["AIR", "ROAD", "SEA"]),
    destination,
    departureDate: dateStr,
    availableWeightKg: z.number({ error: "Enter the weight you can carry." }).positive("Weight must be more than 0 kg.").max(1_000_000),
    availableVolumeM3: z.number({ error: "Enter the volume you can carry." }).positive("Volume must be more than 0 m³.").max(5_000),
    pricePerChargeableKg: z.number({ error: "Enter the price per kg." }).min(0.01, "Price must be at least $0.01 per kg.").max(100, "Price per kg looks too high. Check the amount."),
    transitDaysMin: z.number({ error: "Enter the fastest transit in days." }).int().min(0).max(90),
    transitDaysMax: z.number({ error: "Enter the slowest transit in days." }).int().min(0).max(90),
    equipment: z.string().trim().min(2, "Choose or enter the equipment.").max(60),
    cutoffHours: z.number({ error: "Enter the cutoff in hours." }).int().min(0).max(240),
    maxPieceKg: z.number({ error: "Enter the max piece weight." }).positive("Max piece weight must be more than 0 kg.").max(100_000),
    acceptsDangerousGoods: z.boolean(),
    minChargeableKg: z.number().min(0).max(1_000_000),
    restrictions: z.string().trim().max(200, "Keep restrictions under 200 characters.").default(""),
  })
  .superRefine((v, ctx) => {
    if (v.transitDaysMax < v.transitDaysMin) {
      ctx.addIssue({ code: "custom", path: ["transitDaysMax"], message: "Slowest transit must be at least the fastest transit." });
    }
    if (!MODES_BY_DESTINATION[v.destination]?.includes(v.mode)) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "This mode is not available to that destination." });
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
