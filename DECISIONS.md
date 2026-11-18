# Decisions

Choices made where the spec was ambiguous, or where domain review changed it. Each is easy to reverse.

## Changes to the spec

1. **Modes are Air, Rail and Road. There is no sea mode.** Uzbekistan is landlocked, so sea freight from Tashkent is always a multimodal trip through a foreign port, and rail is the real overland alternative in Central Asia. Dubai has no direct rail link from Tashkent, so it is offered by air and road only. Istanbul and Almaty are offered by air, rail and road.
2. **Each carrier chooses its own pricing unit.** Per chargeable kg, per m² of floor space, a flat price for the whole truck or wagon, or per vehicle. Air is per kg only. Road and rail can use any. The price column of every offer shows how it is calculated, for example "$200/m² × 20 m²".
3. **Vehicles are a separate cargo kind.** The shipper picks "Vehicles" and enters a count. Only carriers that take vehicles (car carriers, car-carrier wagons) are offered, priced per vehicle. All other carriers appear under "Not available" with "Carries vehicles only" or "Carries general cargo only". Weight and volume of vehicles are estimated at 1,500 kg and 12 m³ each so they are never empty.
4. **Floor space for per-m² pricing.** When the shipper gives the size of one piece, floor space is computed from it (footprint × pieces, ÷ 2 if stackable, ÷ 0.9 usable floor). If they only give totals, it is estimated as volume ÷ 2 m, or they can enter it. The form shows the numbers. Road forwarders usually quote loading metres (LDM); the demo uses m² as the carrier sells it.
5. **Capacity is checked against what the shipment physically takes:** actual weight, volume, floor space (when the carrier sells it) or vehicle slots. Not against chargeable weight, which only sets the per-kg price. Approval deducts the same quantities from the listing.
6. **Demo shipment is 25 crates of 160 × 100 × 100 cm, 240 kg each (6,000 kg, 40 m³), stackable, deliver by day 14.** At 6,000 kg the volumetric rule applies in air (6,680 kg charged). A 14-day deadline lets rail (9 to 12 days) compete.
7. **Seed edge cases:** belly narrow-body with 4,000 kg and 14 m³ left (insufficient capacity), belly wide-body with 150 kg max piece (piece too heavy), a road listing that arrives 3 days late, a rail listing that arrives 1 day late, and car carriers by road and rail (vehicles only).
8. **Priority results in the demo:** Fastest recommends air, Balanced recommends the full truck by road, Cheapest recommends rail per m². Three priorities, three different modes.
9. **Several reasons can apply to one listing.** All are shown. The first, in the order cargo kind, dangerous goods, piece weight, capacity, deadline, sets `status`.
10. **Added fields:** `pieces`, `commodity`, `floorAreaM2`, `vehicleCount` and `cargoKind` on the shipment. `pricingUnit`, `unitPrice`, `cargoKind`, `availableFloorM2`, `availableVehicles` on the listing. `rejectionReason` on the booking.
11. **Added: "Air waybill data (illustrative)"** block on air bookings, with the fields an air waybill needs. It says plainly that nothing is connected.
12. **Added: carrier company switcher ("Acting as")** next to the role switcher. Without it there is no way to approve a request for a specific carrier. Unverified carriers can be selected, to show that their listings stay hidden.
13. **Fewer questions on the shipment form.** Destination, what you ship, the size of one piece (or the totals) and dates are enough to compare. Pieces × size gives weight, volume and floor space automatically. Common sizes (euro pallet and others), "7, 14 or 30 days after ready" shortcuts, and everything optional (description, cargo type, notes, heaviest piece) is folded away. Description defaults to "General cargo".
14. **"How many pieces fit" for shippers.** Offers with floor space show "Room for N pieces like yours", and the booking drawer shows how much of the free floor the shipment takes.
15. **Space calculator for carriers.** Enter the empty space (presets for a 13.6 m trailer, containers, a rail platform) and the size of one piece to see how many fit, with a top view of the floor. "Use this space" fills floor and volume in the listing. The packing is a simple grid in either orientation, stacked up to 2 high when allowed. It is an estimate, not a loading plan.
16. **Added: "Load demo shipment"** on the shipment form. **"Reset demo data"** in the footer (can be turned off).

## Cities, modes and the comparison

- **The city decides the modes.** Sea returns, but only between two coastal cities. Rail and road are listed lane by lane. Everything about a lane (modes, distance) lives in `src/lib/constants.ts`, so a new city is one entry there.
- **The shipper chooses the mode first.** Mode tiles show the best price, the time range, the safety and how many options fit. Choosing one filters the chart and the list. The recommendation and the Cheapest, Fastest and Safest labels are computed on what is shown.
- **A fourth priority, Safest.** Weights (price, time, safety): Cheapest 0.7, 0.2, 0.1. Fastest 0.15, 0.7, 0.15. Safest 0.15, 0.15, 0.7. Balanced 0.45, 0.4, 0.15. On the demo shipment each gives a different offer. When every offer is equally safe, safety has no effect.
- **Handling safety is invented.** Air 5, rail 4, sea 3, road 3, and 2 for a shared groupage trailer. It is labelled as a demo estimate wherever it is shown. It is not a claim about any real carrier.
- **Vehicle drawings are illustrations.** They are drawn in code (aircraft, container ship, roll-on roll-off vessel, rail wagon, truck, car carriers). Photos of a real fleet would imply a real carrier.
- **Free space shows three parts:** already booked by others, your cargo, and what stays free. The original capacity is stored on each listing for this.
- **Generated lanes.** Every city pair except the three hand-written Tashkent lanes gets invented listings from the distance. A test checks that none departs before the ready date and that each listing's mode runs on its lane.

## Accounts

- **Real accounts with email and password.** Hashed with scrypt (built into Node), random salt, constant-time comparison. Login answers with one message whether the email or the password was wrong, and spends the same time either way.
- **The cookie holds only a signed user id.** Role and company come from the database on every request. Every server action checks role and ownership again.
- **New carriers start unverified and hidden.** Verification is by hand: the profile must be complete or the carrier must have 3 delivered shipments, and a person presses Verify. This keeps fraud out without an automatic rule that can be gamed.
- **Admin is a passcode, not an account.** If admin were "the user with this email", anyone could register that email first. `ADMIN_PASSCODE` is separate and switches admin off when empty.
- **Demo accounts have no password.** They hold invented data, are recognised by their email ending, and are switched off with `ALLOW_DEMO_ACCOUNTS=false`. Registering with that email ending is refused.
- **Reset demo data only touches demo records**, so real accounts survive it.
- **Not done, on purpose:** email verification and password reset (the app sends no email), two-factor login, session revocation.

## The site

- **`/` is the story site, `/demo` is the role chooser.** The site explains the product with working parts instead of feature cards: the hero chart runs the real decision rules, and each section has a small tool (cargo totals, pricing units, how many pieces fit, documents and milestones).
- **Motion:** one entrance (the hero chart draws in, the deadline line drops). The rest answers a click. Reduced motion is respected and nothing loops.
- **The site never names a real company or product.** The integration section says "your cargo system", marks the sample data as illustrative and uses an invented flight number.
- **Pilot lane is stated plainly.** Tashkent is the only origin with data. The site says so and lists the next lanes as plans, not as features.

## Implementation choices

- **Dates are date-only, UTC.** Seed dates are relative to the day the seed runs (`DEMO_READY_OFFSET_DAYS`, default 3). Re-run the seed or use Reset demo data before the demo.
- **Server recomputes shipment totals** from the piece size whenever it is given. The client never sets weight, volume or floor space in that case.
- **Usable floor is 90% and stacking is 2 high.** Both are placeholders to confirm with a road or rail forwarder (`src/lib/fit.ts`).
- **Chargeable weight is rounded up to whole kg.** Money is rounded to cents. The rail volumetric factor (500 kg/m³) is a placeholder to confirm with a rail forwarder.
- **Duplicate last listing** copies the carrier's most recent listing and moves the departure a week later. The quick picks (Tomorrow, In 3 days, In 7 days) then set the date.
- **Font:** Archivo variable (width axis) from `@fontsource-variable/archivo` instead of `next/font/google`. Same font, but it needs no network at build time.
- **Mode color:** rail reuses the teal that the spec gave to sea.
- **Schema:** `prisma db push` instead of migrations. Fine for a demo with seeded data.
- **Ties in the decision layer** go to the lower price, then the shorter transit.
- **Capacity is reserved on approval, not on request.** Two requests can compete for the same space. Approval re-checks capacity in one database statement, so the second one fails with a clear message.
- **Rail consignment note:** "SMGS or CIM, depending on the route". Vehicle bookings add a vehicle list and registration documents to the checklist. All checklists are indicative.

## Security (demo-appropriate)

- The role cookie is signed (HMAC) and httpOnly. It selects a role, it does not authenticate anyone.
- Every server action checks role and ownership on the server. Carrier company and shipper company always come from the session, never from the request. Price is always computed on the server.
- Unverified carriers are filtered in the database query and again when a booking is requested. A unit test covers the rule.
- Input is validated with zod on the server. No `dangerouslySetInnerHTML`.
- Optional passcode gate (`DEMO_PASSCODE`) for shared links, with a small attempt limiter. The gate page is GET-only and sits outside the app layout, so server actions cannot be reached through it.
- Security headers (CSP, frame, content type, referrer, permissions) and `noindex`.
- **Not done:** real authentication, per-user accounts, durable rate limiting (use the host's firewall), audit log. The README says so.
