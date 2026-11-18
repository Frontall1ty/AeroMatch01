# AeroMatch demo

A Tashkent-origin freight comparison and booking demo. One cargo entry, air, rail and road compared side by side with a decision layer. Each carrier prices in its own way (per kg, per m² of floor space, flat, or per vehicle). Capacity entry takes under a minute, and document checklists and milestones are specific to each mode.

> **All data is fictional.** Prices, carriers and capacities are invented. No carrier is connected. There is no real authentication.

## Run it locally

Needs Node 20 or newer and a PostgreSQL database.

```bash
npm install
cp .env.example .env        # then edit DATABASE_URL and SESSION_SECRET
npm run db:push             # create the tables
npm run db:seed             # load the demo data
npm run dev                 # http://localhost:3000
```

Other commands:

```bash
npm test                    # unit tests for the business rules
npm run build && npm start  # production build
BASE_URL=http://localhost:3000 npm run demo:check   # runs the demo script in a browser (needs Playwright)
npm run db:reset            # wipe and reseed
```

## Deploy to Vercel

1. Create a free PostgreSQL database (Neon or Supabase) and copy its connection string.
2. Push this folder to a Git repository and import it in Vercel.
3. Set these environment variables in Vercel:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the connection string (add `?sslmode=require` if the provider asks) |
| `SESSION_SECRET` | a long random string, for example `openssl rand -hex 32` |
| `DEMO_PASSCODE` | optional: a passcode for the whole site, recommended for shared links |
| `ALLOW_DEMO_RESET` | `false` for shared links, `true` if you want the Reset button |
| `DEMO_READY_OFFSET_DAYS` | optional, default 3 |

4. From your computer, create the tables and load the data in the production database:

```bash
DATABASE_URL="<production connection string>" npx prisma db push
DATABASE_URL="<production connection string>" npm run db:seed
```

5. Deploy. Run the seed again on the morning of the demo so the dates are fresh.

## The 3 minute demo script

1. Carrier: **Add capacity**. Click **Duplicate last listing**, pick **In 3 days**, click **Add capacity**.
2. Shipper: **New shipment**, **Load demo shipment**, **Compare options**. Point out the lane chart, the Recommended line with its reason, and the reasons under **Not available**.
3. Switch priority to **Fastest** (air), **Cheapest** (rail, priced per m²), then **Balanced** (road, flat truck price). Point at the price column: every offer shows how it is calculated.
4. **Request booking** on an air offer. Show the document checklist, then confirm.
5. Carrier: **Requests**, **Approve**. Then **Active bookings**, **Mark as ...** until Delivered.
6. Shipper: **My bookings**. Show the full milestone timeline and the air waybill data.
7. Optional: **New shipment**, choose **Vehicles**, enter 4. Only the car carriers by road and rail are offered, priced per vehicle.

## Honest limits

- All data is fictional and no carrier is connected.
- Capacity is entered manually by design.
- No real authentication. The role switcher is for the demo only.
- Volumetric factors, milestone codes, availability rules and the document checklist are simplified and need review with industry practitioners. Rail volumetric factor and the floor-space estimate (volume ÷ 2 m) are placeholders. Road forwarders usually quote loading metres (LDM), not m².
- Not built: admin screens, payments, notifications, carrier APIs, real tracking, document upload, other languages, recurring capacity agreements, consolidation, analytics.

## Where the rules live

`src/lib/rules.ts` holds the chargeable weight, pricing units, availability, visibility, decision layer and milestone rules. `src/lib/constants.ts` holds the factors, milestones and document checklists. Decisions that differ from the original spec are in `DECISIONS.md`.
