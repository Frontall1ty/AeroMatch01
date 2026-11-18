/**
 * Runs during the build. Creates the tables if they are missing and loads the demo data
 * only when the database is empty, so a deploy never wipes existing data.
 * On Vercel a failure stops the build. Locally it only warns.
 */
import { execFileSync, execSync } from "node:child_process";
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

  console.log("Checking the database against the schema...");
  const env = { ...process.env, DATABASE_URL: url };
  // What would change? Only additions are applied on their own (new tables, columns, indexes, enum values).
  // Anything that drops or rewrites data stops the build, so a deploy can never lose data by surprise.
  const script = execFileSync(
    "npx",
    ["prisma", "migrate", "diff", "--from-url", url, "--to-schema-datamodel", "prisma/schema.prisma", "--script"],
    { encoding: "utf8", env },
  );
  const destructive = script.split("\n").filter((line) => /\bDROP\b|\bTRUNCATE\b|\bDELETE\b|ALTER COLUMN .* TYPE|\bRENAME\b/i.test(line) && !/DROP DEFAULT|DROP NOT NULL/i.test(line));
  if (destructive.length > 0) {
    console.error("The schema change would remove or rewrite data, so the build stops here:\n" + destructive.join("\n"));
    console.error("Apply that change by hand after backing up the database, then redeploy.");
    process.exit(1);
  }
  if (/empty migration/i.test(script)) {
    console.log("The database already matches the schema.");
  } else {
    console.log("Applying additions:\n" + script.trim());
    execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit", env });
  }

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
