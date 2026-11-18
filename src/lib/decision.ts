/* ---------- 6.3 Decision layer ---------- */

const n0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export type Priority = "CHEAPEST" | "FASTEST" | "SAFEST" | "BALANCED";

/** How much price, time and handling safety count for each priority. Each row adds up to 1. */
export const PRIORITY_WEIGHTS: Record<Priority, { price: number; time: number; safety: number }> = {
  CHEAPEST: { price: 0.7, time: 0.2, safety: 0.1 },
  FASTEST: { price: 0.15, time: 0.7, safety: 0.15 },
  SAFEST: { price: 0.15, time: 0.15, safety: 0.7 },
  BALANCED: { price: 0.45, time: 0.4, safety: 0.15 },
};

export const DEFAULT_SAFETY = 3;

export type ScorableOffer = {
  id: string;
  totalPrice: number;
  transitDaysMin: number;
  transitDaysMax: number;
  /** 1 to 5, a demo estimate. Offers without one count as 3. */
  safetyScore?: number;
};

export const transitMid = (o: Pick<ScorableOffer, "transitDaysMin" | "transitDaysMax">) =>
  (o.transitDaysMin + o.transitDaysMax) / 2;

const safetyOf = (o: Pick<ScorableOffer, "safetyScore">) => o.safetyScore ?? DEFAULT_SAFETY;

function normalise(value: number, min: number, max: number): number {
  return max === min ? 0 : (value - min) / (max - min);
}

/** Lowest score wins. Ties go to the lower price, then the shorter transit, then id. */
export function recommend<T extends ScorableOffer>(
  offers: T[],
  priority: Priority,
): { recommended: T | null; scores: Map<string, number> } {
  const scores = new Map<string, number>();
  if (offers.length === 0) return { recommended: null, scores };

  const prices = offers.map((o) => o.totalPrice);
  const times = offers.map(transitMid);
  const safeties = offers.map(safetyOf);
  const [pMin, pMax] = [Math.min(...prices), Math.max(...prices)];
  const [tMin, tMax] = [Math.min(...times), Math.max(...times)];
  const [sMin, sMax] = [Math.min(...safeties), Math.max(...safeties)];
  const w = PRIORITY_WEIGHTS[priority];

  for (const o of offers) {
    // 0 for the safest offer, 1 for the least safe. 0 for everyone when all are equally safe.
    const safetyDeficit = sMax === sMin ? 0 : 1 - normalise(safetyOf(o), sMin, sMax);
    scores.set(
      o.id,
      w.price * normalise(o.totalPrice, pMin, pMax) + w.time * normalise(transitMid(o), tMin, tMax) + w.safety * safetyDeficit,
    );
  }

  const sorted = [...offers].sort(
    (a, b) =>
      scores.get(a.id)! - scores.get(b.id)! ||
      a.totalPrice - b.totalPrice ||
      transitMid(a) - transitMid(b) ||
      a.id.localeCompare(b.id),
  );
  return { recommended: sorted[0], scores };
}

export function recommendationReason(
  recommended: ScorableOffer,
  offers: ScorableOffer[],
  priority: Priority = "BALANCED",
): string {
  const cheapest = [...offers].sort((a, b) => a.totalPrice - b.totalPrice || transitMid(a) - transitMid(b))[0];
  const bestSafety = Math.max(...offers.map(safetyOf));

  if (priority === "SAFEST" && safetyOf(recommended) === bestSafety && offers.some((o) => safetyOf(o) < bestSafety)) {
    const base = `Safest handling among options that meet your deadline (${safetyOf(recommended)} of 5, a demo estimate).`;
    if (cheapest && cheapest.id !== recommended.id && recommended.totalPrice > cheapest.totalPrice) {
      return `${base} Costs $${n0.format(Math.round(recommended.totalPrice - cheapest.totalPrice))} more than the cheapest option.`;
    }
    return base;
  }

  if (!cheapest || cheapest.id === recommended.id || recommended.totalPrice <= cheapest.totalPrice) {
    return "Lowest price among options that meet your deadline.";
  }
  const extra = recommended.totalPrice - cheapest.totalPrice;
  const daysSaved = transitMid(cheapest) - transitMid(recommended);
  const extraText = `Costs $${n0.format(Math.round(extra))} more than the cheapest option`;
  if (daysSaved < 0.5) return `${extraText} with a similar transit time.`;
  const perDay = Math.round(extra / daysSaved);
  const days = Math.max(1, Math.round(daysSaved));
  return `${extraText} and arrives about ${plural(days, "day")} earlier ($${n0.format(perDay)} per day saved).`;
}

export type OfferLabel = "CHEAPEST" | "FASTEST" | "SAFEST";

/**
 * Which offers carry the Cheapest, Fastest and Safest labels, among the given offers.
 * A label goes to every offer that ties for it. Safest is only given when the offers differ in safety.
 */
export function labelOffers(offers: ScorableOffer[]): Map<string, OfferLabel[]> {
  const labels = new Map<string, OfferLabel[]>(offers.map((o) => [o.id, []]));
  if (offers.length === 0) return labels;
  const minPrice = Math.min(...offers.map((o) => o.totalPrice));
  const minTime = Math.min(...offers.map(transitMid));
  const maxSafety = Math.max(...offers.map(safetyOf));
  const safetyDiffers = offers.some((o) => safetyOf(o) !== maxSafety);
  for (const o of offers) {
    const l = labels.get(o.id)!;
    if (o.totalPrice === minPrice) l.push("CHEAPEST");
    if (transitMid(o) === minTime) l.push("FASTEST");
    if (safetyDiffers && safetyOf(o) === maxSafety) l.push("SAFEST");
  }
  return labels;
}
