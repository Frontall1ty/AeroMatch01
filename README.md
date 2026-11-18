# AeroMatch demo

A freight comparison and booking demo. A shipment starts in the shipper's own city. One cargo entry, then every mode that runs from that city (air, rail, road and, from coastal cities, sea) side by side, with the vehicle, the company, the departure, the free space and the price. Each option is marked cheapest, fastest or safest. Each carrier prices in its own way (per kg, per m² of floor space, flat, or per vehicle). Capacity entry takes under a minute, and document checklists and milestones are specific to each mode.

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

1. **GitHub.** Put this folder in a private GitHub repository.
2. **Vercel project.** Sign in at vercel.com with GitHub, choose **Add New, Project**, import the repository and add `SESSION_SECRET` (a long random string, at least 32 characters) and `DEMO_PASSCODE` (a passcode for the whole site, recommended for shared links) under Environment Variables. The first deploy fails because there is no database yet. That is expected.
3. **Database.** In the project, open **Storage**, choose **Create Database**, then **Neon (Postgres)**, and connect it to the project. Vercel adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you. The app uses the direct one. Without the Vercel integration, set `DATABASE_URL` yourself to a direct (not pooled) connection string.

| Variable | Value |
|---|---|
| `DATABASE_URL` | added by the Neon integration |
| `SESSION_SECRET` | a long random string, at least 32 characters |
| `DEMO_PASSCODE` | a passcode for the whole site. Recommended for any shared link |
| `ALLOW_DEMO_RESET` | `true` keeps the Reset demo data button in the footer, `false` hides it |
| `ADMIN_PASSCODE` | a passcode for `/admin`, where you verify carriers by hand. Admin is off without it |
| `ALLOW_REGISTRATION` | `false` closes sign-up |
| `ALLOW_DEMO_ACCOUNTS` | `false` hides the passwordless demo accounts at `/demo` |
| `DEMO_READY_OFFSET_DAYS` | optional, default 3 |

4. **Redeploy** (Deployments, then Redeploy). The build creates the tables and loads the demo data when the database is empty. It never touches data that is already there.
5. **On the morning of the demo,** open the site and click **Reset demo data** in the footer. That moves the seeded dates to the coming days.

Every push to the repository deploys again by itself.

## Pages

- `/` the story site. `/register` and `/login` for real accounts. `/demo` has passwordless demo accounts with invented data.
- `/shipper/...` and `/carrier/...` are the two roles. `/account` is the company profile and, for carriers, the verification status.
- `/admin` is where you verify carriers by hand. It has its own passcode (`ADMIN_PASSCODE`) and does not depend on any account.

## How the modes follow the city

- Each user has a city. A shipment starts there, and the form only offers destinations that can be reached from it.
- **Air** runs between any two cities. **Sea** only between two coastal cities, so an inland city like Tashkent never gets sea. **Rail** and **road** are listed lane by lane in `src/lib/constants.ts` (`modesBetween`).
- The shipper first chooses how to send it (air, sea, rail, road), and the list below shows only that mode. Each option shows a drawing of the vehicle, the company, when it departs and arrives, how much space is free (and how much would stay free after your cargo), and the price with how it is worked out.
- **Cheapest, Fastest and Safest** are marked on the options. "What matters most" (Cheapest, Fastest, Safest, Balanced) decides the recommended one.
- **The handling safety score (1 to 5) is invented**, per mode and equipment, and says so on screen. Real scores would come from damage and claims data.
- Seeded lanes: the Tashkent lanes to Istanbul, Dubai and Almaty are written by hand (they carry the demo story). All other city pairs are generated from the distance, so longer lanes cost more and take longer.

## Payments and what comes after a booking

Not built, on purpose. The app takes a request and the carrier approves it. No money moves and nothing is sent by email.
The plan, in the order it can be added:

1. **Invoice and bank transfer (no licence needed).** After approval the carrier issues an invoice with its bank details and marks it paid when the transfer arrives. AeroMatch bills its commission to the carrier separately. This is how most business freight is paid.
2. **Escrow** (money held until delivery) with a licensed payment partner. Holding other people's money is regulated, so it needs a licensed partner and a lawyer, not code alone.
3. **Documents** uploaded and checked per shipment, then **insurance** and a **customs broker** as add-ons.
4. **Real tracking** from carrier systems or devices, in place of the hand-updated milestones.
5. **Claims and disputes**, and carrier ratings from real deliveries.

## Accounts and verification

- Sign-up needs an email and a password of at least 10 characters. Passwords are hashed with scrypt. Email addresses are not verified, because the app sends no email.
- A new carrier starts **not verified**. It can add capacity, but shippers do not see its offers.
- A carrier qualifies for verification when its company profile is complete (city, phone, address, tax ID) **or** it has 3 delivered shipments. Qualifying never verifies by itself. You check the company and press **Verify** in `/admin`.
- "Reset demo data" removes only demo records (ids that start with `demo-`). Real accounts are never touched.

## The 3 minute demo script

0. Open `/`, read the site, then go to `/demo` and choose the demo carrier **Demo Air Cargo A**.
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
- Accounts are real but simple: no email check, no password reset, and a session cannot be revoked before it expires. Rate limits are in memory and per server instance.
- Volumetric factors, milestone codes, availability rules and the document checklist are simplified and need review with industry practitioners. Rail volumetric factor and the floor-space estimate (volume ÷ 2 m) are placeholders. Road forwarders usually quote loading metres (LDM), not m².
- Not built: admin screens, payments, notifications, carrier APIs, real tracking, document upload, other languages, recurring capacity agreements, consolidation, analytics.

## Where the rules live

`src/lib/rules.ts` holds the chargeable weight, pricing units, availability, visibility, decision layer and milestone rules. `src/lib/constants.ts` holds the factors, milestones and document checklists. Decisions that differ from the original spec are in `DECISIONS.md`.
