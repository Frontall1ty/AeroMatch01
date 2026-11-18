import { addDays, daysBetween } from "./dates";
import { piecesThatFit } from "./fit";
import { evaluateAvailability, priceFor, type Availability, type ShipmentInput } from "./rules";
import type { CargoKind, Mode, PricingUnit } from "./constants";

type ListingRow = {
  id: string;
  mode: Mode;
  destination: string;
  cargoKind: CargoKind;
  pricingUnit: PricingUnit;
  unitPrice: number;
  departureDate: Date;
  availableWeightKg: number;
  availableVolumeM3: number;
  availableFloorM2: number | null;
  availableVehicles: number | null;
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
  cargoKind: CargoKind;
  pricingUnit: PricingUnit;
  unitPrice: number;
  /** For example "$200/m² × 20 m²". */
  priceBasis: string;
  departureDate: string; // ISO
  departDay: number; // days after ready date
  arrivalMinDay: number;
  arrivalMaxDay: number;
  arrivalMinDate: string;
  arrivalMaxDate: string;
  transitDaysMin: number;
  transitDaysMax: number;
  chargedKg: number;
  totalPrice: number;
  /** Pieces like the shipper's that fit in the free floor space. Null when unknown. */
  piecesFit: number | null;
  /** Short description of what is left, for example "22,000 kg, 82 m³" or "8 vehicle slots". */
  availableWeightKg: number;
  availableVolumeM3: number;
  availableFloorM2: number | null;
  availableVehicles: number | null;
  equipment: string;
  cutoffHours: number;
  maxPieceKg: number;
  acceptsDangerousGoods: boolean;
  restrictions: string;
  status: Availability["status"];
  reasons: Availability["reasons"];
};

export function buildOffers(shipment: ShipmentInput, listings: ListingRow[]): OfferView[] {
  const piece =
    shipment.pieceLengthCm && shipment.pieceWidthCm && shipment.pieceHeightCm && shipment.pieceWeightKg
      ? {
          lengthCm: shipment.pieceLengthCm,
          widthCm: shipment.pieceWidthCm,
          heightCm: shipment.pieceHeightCm,
          weightKg: shipment.pieceWeightKg,
          stackable: shipment.stackable ?? false,
        }
      : null;
  return listings.map((l) => {
    const price = priceFor({
      mode: l.mode,
      pricingUnit: l.pricingUnit,
      unitPrice: l.unitPrice,
      minChargeableKg: l.minChargeableKg,
      shipment,
    });
    const availability = evaluateAvailability(shipment, l);
    const departDay = daysBetween(shipment.readyDate, l.departureDate);
    return {
      id: l.id,
      carrierName: l.carrier.name,
      carrierVerified: l.carrier.verified,
      mode: l.mode,
      cargoKind: l.cargoKind,
      pricingUnit: l.pricingUnit,
      unitPrice: l.unitPrice,
      priceBasis: price.basis,
      departureDate: l.departureDate.toISOString(),
      departDay,
      arrivalMinDay: departDay + l.transitDaysMin,
      arrivalMaxDay: departDay + l.transitDaysMax,
      arrivalMinDate: addDays(l.departureDate, l.transitDaysMin).toISOString(),
      arrivalMaxDate: addDays(l.departureDate, l.transitDaysMax).toISOString(),
      transitDaysMin: l.transitDaysMin,
      transitDaysMax: l.transitDaysMax,
      chargedKg: price.chargedKg,
      totalPrice: price.total,
      piecesFit: piece && l.availableFloorM2 != null ? piecesThatFit(l.availableFloorM2, piece) : null,
      availableWeightKg: l.availableWeightKg,
      availableVolumeM3: l.availableVolumeM3,
      availableFloorM2: l.availableFloorM2,
      availableVehicles: l.availableVehicles,
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
