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

## Deploy to Vercel (no terminal needed)

1. **Database.** Create a free PostgreSQL database at neon.tech and copy its **direct (not pooled)** connection string. Tables are created during the build, which does not work through a pooled connection.
2. **GitHub.** Put this folder in a private GitHub repository.
3. **Vercel.** Sign in at vercel.com with GitHub, choose **Add New, Project**, import the repository and add these environment variables before you press Deploy:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string (ends with `?sslmode=require`) |
| `SESSION_SECRET` | a long random string, at least 32 characters |
| `DEMO_PASSCODE` | a passcode for the whole site. Recommended for any shared link |
| `ALLOW_DEMO_RESET` | `true` keeps the Reset demo data button in the footer, `false` hides it |
| `DEMO_READY_OFFSET_DAYS` | optional, default 3 |

4. **Deploy.** The build creates the tables and loads the demo data when the database is empty. It never touches data that is already there.
5. **On the morning of the demo,** open the site and click **Reset demo data** in the footer. That moves the seeded dates to the coming days.

Every push to the repository deploys again by itself.

## The 3 minute demo script

1. Carrier: **Add capacity**. Click **Duplicate last listing**, pick **In 3 days**, click **Add capacity**.
2. Shipper: **New shipment**, **Load demo shipment** (25 crates; totals appear by themselves), **Compare options**. Point out the lane chart, the Recommended line with its reason, and the reasons under **Not available**.
3. Switch priority to **Fastest** (air), **Cheapest** (rail, priced per m²), then **Balanced** (road, flat truck price). Point at the price column: every offer shows how it is calculated.
4. **Request booking** on an air offer. Show the document checklist, then confirm.
5. Carrier: **Requests**, **Approve**. Then **Active bookings**, **Mark as ...** until Delivered.
6. Shipper: **My bookings**. Show the full milestone timeline and the air waybill data.
7. Optional: carrier **Add capacity**, pick Road or Rail, open **Space calculator** and choose a common piece size to see how many fit.
8. Optional: **New shipment**, choose **Vehicles**, enter 4. Only the car carriers by road and rail are offered, priced per vehicle.

## Honest limits

- All data is fictional and no carrier is connected.
- Capacity is entered manually by design.
- No real authentication. The role switcher is for the demo only.
- Volumetric factors, milestone codes, availability rules and the document checklist are simplified and need review with industry practitioners. Rail volumetric factor and the floor-space estimate (volume ÷ 2 m) are placeholders. Road forwarders usually quote loading metres (LDM), not m².
- Not built: admin screens, payments, notifications, carrier APIs, real tracking, document upload, other languages, recurring capacity agreements, consolidation, analytics.

## Where the rules live

`src/lib/rules.ts` holds the chargeable weight, pricing units, availability, visibility, decision layer and milestone rules. `src/lib/constants.ts` holds the factors, milestones and document checklists. Decisions that differ from the original spec are in `DECISIONS.md`.
