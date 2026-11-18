import { LISTING_DEFAULTS, type CargoKind, type Mode, type PricingUnit } from "./constants";

export type ListingValues = {
  mode: Mode;
  destination: string;
  departureDate: string;
  cargoKind: CargoKind;
  pricingUnit: PricingUnit;
  unitPrice: string;
  availableWeightKg: string;
  availableVolumeM3: string;
  availableFloorM2: string;
  availableVehicles: string;
  transitDaysMin: string;
  transitDaysMax: string;
  equipment: string;
  cutoffHours: string;
  maxPieceKg: string;
  acceptsDangerousGoods: boolean;
  minChargeableKg: string;
  restrictions: string;
};

/** Pre-filled values for a mode, cargo kind and pricing unit. A carrier only changes what differs. */
export function valuesForMode(
  mode: Mode,
  destination: string,
  departureDate: string,
  cargoKind: CargoKind = "GENERAL",
  pricingUnit?: PricingUnit,
): ListingValues {
  const d = LISTING_DEFAULTS[mode];
  const unit: PricingUnit = cargoKind === "VEHICLES" ? "PER_VEHICLE" : (pricingUnit ?? "PER_KG");
  return {
    mode,
    destination,
    departureDate,
    cargoKind,
    pricingUnit: unit,
    unitPrice: String(d.price[unit]),
    availableWeightKg: String(d.weightKg),
    availableVolumeM3: String(d.volumeM3),
    availableFloorM2: unit === "PER_M2" ? String(d.floorM2) : "",
    availableVehicles: cargoKind === "VEHICLES" ? String(d.vehicles) : "",
    transitDaysMin: String(d.transitMin),
    transitDaysMax: String(d.transitMax),
    equipment: cargoKind === "VEHICLES" ? d.vehicleEquipment : d.equipment[0],
    cutoffHours: String(d.cutoffHours),
    maxPieceKg: String(d.maxPieceKg),
    acceptsDangerousGoods: false,
    minChargeableKg: String(d.minChargeableKg),
    restrictions: "",
  };
}
