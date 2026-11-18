import type { Mode } from "@/lib/constants";

/**
 * Demo offers shown on the site. They are the same invented numbers as the seeded demo:
 * 25 crates (6,000 kg, 40 m³, 22.2 m² of floor), ready on day 0, deliver by day 14.
 */
export type HeroOffer = {
  id: string;
  mode: Mode;
  carrier: string;
  detail: string;
  totalPrice: number;
  transitDaysMin: number;
  transitDaysMax: number;
  depart: number;
};

export const HERO_OFFERS: HeroOffer[] = [
  { id: "air-fast", mode: "AIR", carrier: "Demo Air Cargo A", detail: "Freighter", totalPrice: 17368, transitDaysMin: 1, transitDaysMax: 2, depart: 1 },
  { id: "air-value", mode: "AIR", carrier: "Demo Air Cargo A", detail: "Freighter, no dangerous goods", totalPrice: 14028, transitDaysMin: 2, transitDaysMax: 3, depart: 3 },
  { id: "rail", mode: "RAIL", carrier: "Demo Rail Freight", detail: "Container platform, per m²", totalPrice: 2442, transitDaysMin: 9, transitDaysMax: 12, depart: 2 },
  { id: "road-full", mode: "ROAD", carrier: "Demo Trucking Co", detail: "Full truck, flat price", totalPrice: 4800, transitDaysMin: 5, transitDaysMax: 7, depart: 0 },
  { id: "road-groupage", mode: "ROAD", carrier: "Demo Trucking Co", detail: "Groupage trailer, per m²", totalPrice: 4440, transitDaysMin: 6, transitDaysMax: 8, depart: 1 },
];

/** The site tells the Tashkent story: air, rail and road. Sea appears for coastal origins in the app. */
export const SITE_MODES: Mode[] = ["AIR", "RAIL", "ROAD"];

export const HERO_DEADLINE_DAY = 14;
export const HERO_AXIS_DAYS = 16;

export const CRATES = { count: 25, weightKg: 240, lengthCm: 160, widthCm: 100, heightCm: 100 };
