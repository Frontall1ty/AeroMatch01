/**
 * Runs during the build. Creates the tables if they are missing and loads the demo data
 * only when the database is empty, so a deploy never wipes existing data.
 * On Vercel a failure stops the build. Locally it only warns.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "../src/lib/databaseUrl";
import { seedDemoData } from "../src/lib/seed";

const onVercel = Boolean(process.env.VERCEL);
// Same rule as src/lib/db.ts.
const url = resolveDatabaseUrl();

async function main() {
  if (!url) {
    console.log("No PostgreSQL connection string found. Skipping database setup.");
    if (onVercel) {
      console.error("Connect a database to the Vercel project (Storage tab) or add DATABASE_URL under Environment Variables, then redeploy.");
      process.exit(1);
    }
    return;
  }

  console.log("Creating tables if needed...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });

  const prisma = new PrismaClient({ datasourceUrl: url });
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
