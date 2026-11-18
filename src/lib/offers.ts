import { addDays, daysBetween } from "./dates";
import { chargeableWeight, evaluateAvailability, totalPrice, type Availability, type ShipmentInput } from "./rules";
import type { Mode } from "./constants";

type ListingRow = {
  id: string;
  mode: Mode;
  destination: string;
  departureDate: Date;
  availableWeightKg: number;
  availableVolumeM3: number;
  pricePerChargeableKg: number;
  transitDaysMin: number;
  transitDaysMax: number;
  equipment: string;
  cutoffHours: number;
  maxPieceKg: number;
  acceptsDangerousGoods: boolean;
  minChargeableKg: number;
  restrictions: string;
  carrier: { id: string; name: string; verified: boolean };
};

/** Plain, serialisable offer used by the compare screen. */
export type OfferView = {
  id: string;
  carrierName: string;
  carrierVerified: boolean;
  mode: Mode;
  departureDate: string; // ISO
  departDay: number; // days after ready date
  arrivalMinDay: number;
  arrivalMaxDay: number;
  arrivalMinDate: string;
  arrivalMaxDate: string;
  transitDaysMin: number;
  transitDaysMax: number;
  actualKg: number;
  volumetricKg: number;
  chargedKg: number;
  pricePerKg: number;
  totalPrice: number;
  availableWeightKg: number;
  availableVolumeM3: number;
  equipment: string;
  cutoffHours: number;
  maxPieceKg: number;
  acceptsDangerousGoods: boolean;
  restrictions: string;
  status: Availability["status"];
  reasons: Availability["reasons"];
};

export function buildOffers(shipment: ShipmentInput, listings: ListingRow[]): OfferView[] {
  return listings.map((l) => {
    const charge = chargeableWeight({
      mode: l.mode,
      weightKg: shipment.weightKg,
      volumeM3: shipment.volumeM3,
      minChargeableKg: l.minChargeableKg,
    });
    const availability = evaluateAvailability(shipment, l);
    const departDay = daysBetween(shipment.readyDate, l.departureDate);
    return {
      id: l.id,
      carrierName: l.carrier.name,
      carrierVerified: l.carrier.verified,
      mode: l.mode,
      departureDate: l.departureDate.toISOString(),
      departDay,
      arrivalMinDay: departDay + l.transitDaysMin,
      arrivalMaxDay: departDay + l.transitDaysMax,
      arrivalMinDate: addDays(l.departureDate, l.transitDaysMin).toISOString(),
      arrivalMaxDate: addDays(l.departureDate, l.transitDaysMax).toISOString(),
      transitDaysMin: l.transitDaysMin,
      transitDaysMax: l.transitDaysMax,
      actualKg: charge.actualKg,
      volumetricKg: charge.volumetricKg,
      chargedKg: charge.chargedKg,
      pricePerKg: l.pricePerChargeableKg,
      totalPrice: totalPrice(charge.chargedKg, l.pricePerChargeableKg),
      availableWeightKg: l.availableWeightKg,
      availableVolumeM3: l.availableVolumeM3,
      equipment: l.equipment,
      cutoffHours: l.cutoffHours,
      maxPieceKg: l.maxPieceKg,
      acceptsDangerousGoods: l.acceptsDangerousGoods,
      restrictions: l.restrictions,
      status: availability.status,
      reasons: availability.reasons,
    };
  });
}
