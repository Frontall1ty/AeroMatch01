import { prisma } from "./db";
import { demoReadyDate } from "./seed";

/** The date the demo data is built around: the earliest open departure of a verified carrier. */
export async function getDemoReadyDate(): Promise<Date> {
  const first = await prisma.capacityListing.findFirst({
    where: { status: "OPEN", carrier: { verified: true } },
    orderBy: { departureDate: "asc" },
    select: { departureDate: true },
  });
  return first?.departureDate ?? demoReadyDate();
}
