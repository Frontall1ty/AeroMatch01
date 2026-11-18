import { LISTING_DEFAULTS, type Mode } from "./constants";

export type ListingValues = {
  mode: Mode;
  destination: string;
  departureDate: string;
  availableWeightKg: string;
  availableVolumeM3: string;
  pricePerChargeableKg: string;
  transitDaysMin: string;
  transitDaysMax: string;
  equipment: string;
  cutoffHours: string;
  maxPieceKg: string;
  acceptsDangerousGoods: boolean;
  minChargeableKg: string;
  restrictions: string;
};

export function valuesForMode(mode: Mode, destination: string, departureDate: string): ListingValues {
  const d = LISTING_DEFAULTS[mode];
  return {
    mode,
    destination,
    departureDate,
    availableWeightKg: String(d.weightKg),
    availableVolumeM3: String(d.volumeM3),
    pricePerChargeableKg: String(d.pricePerKg),
    transitDaysMin: String(d.transitMin),
    transitDaysMax: String(d.transitMax),
    equipment: d.equipment[0],
    cutoffHours: String(d.cutoffHours),
    maxPieceKg: String(d.maxPieceKg),
    acceptsDangerousGoods: false,
    minChargeableKg: String(d.minChargeableKg),
    restrictions: "",
  };
}

