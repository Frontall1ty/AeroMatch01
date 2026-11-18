import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/seed";

const prisma = new PrismaClient();

seedDemoData(prisma)
  .then(async () => {
    const n = await prisma.capacityListing.count();
    console.log(`Seeded demo data: ${n} listings.`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
