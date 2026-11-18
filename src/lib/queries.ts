import { prisma } from "./db";
import { demoReadyDate } from "./seed";

/** The date the demo data is built around: the earliest open Tashkent to Istanbul departure. */
export async function getDemoReadyDate(): Promise<Date> {
  const first = await prisma.capacityListing.findFirst({
    where: { origin: "TAS", destination: "IST", status: "OPEN", carrier: { verified: true } },
    orderBy: { departureDate: "asc" },
    select: { departureDate: true },
  });
  return first?.departureDate ?? demoReadyDate();
}
