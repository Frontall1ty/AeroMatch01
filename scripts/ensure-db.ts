/**
 * Runs during the build. Creates the tables if they are missing and loads the demo data
 * only when the database is empty, so a deploy never wipes existing data.
 * On Vercel a failure stops the build. Locally it only warns.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/seed";

const onVercel = Boolean(process.env.VERCEL);

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set. Skipping database setup.");
    if (onVercel) {
      console.error("Add DATABASE_URL in the Vercel project settings (Environment Variables), then redeploy.");
      process.exit(1);
    }
    return;
  }

  console.log("Creating tables if needed...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

  const prisma = new PrismaClient();
  try {
    const companies = await prisma.company.count();
    if (companies === 0) {
      await seedDemoData(prisma);
      console.log("Loaded the demo data.");
    } else {
      console.log("Demo data is already there. Left as it is.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  if (onVercel) process.exit(1);
  console.warn("Database setup skipped (not running on Vercel).");
});
