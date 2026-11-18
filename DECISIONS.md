# Decisions

Choices made where the spec was ambiguous, or where domain review changed it. Each is easy to reverse.

## Changes to the spec (domain review)

1. **Capacity is checked against actual weight and volume, not chargeable weight.** A carrier's space is limited by both kg and m³. The spec stored `availableVolumeM3` but never used it. The reason text reads "Only 4,000 kg and 14 m³ left". Chargeable weight still sets the price. On approval both weight and volume are deducted from the listing.
2. **Demo shipment is 6,000 kg, 40 m³, heaviest piece 800 kg, 24 pieces.** At 20,000 kg the volumetric rule never applied. At 6,000 kg air charges 6,680 kg (volumetric wins), road 13,320 kg, sea 40,000 kg.
3. **Seed edge cases adapted to that shipment.** Belly narrow-body with 4,000 kg and 14 m³ left (insufficient capacity), belly wide-body with 150 kg max piece (piece too heavy), a road listing that arrives 2 days late, and a sea listing that arrives 27 days late.
4. **Sea is not offered to Almaty.** Kazakhstan and Uzbekistan are landlocked, so the destination and mode list enforces `ALA` as Air and Road only. Sea to Istanbul and Dubai is "via port, includes inland transfer".
5. **Sea appears under "Not available" for the demo deadline.** Sea takes 3 to 5 weeks. The reason text ("Arrives 27 days after your deadline") and the hint ("A deliver-by date of 27 Dec would fit") are part of the story. Moving the deadline in Edit brings sea into the lane chart.
6. **Several reasons can apply to one listing.** All are shown. The first, in the order dangerous goods, piece weight, capacity, deadline, sets `status`.
7. **Added fields:** `pieces`, `commodity` (description of goods) on the shipment and `rejectionReason` on the booking. An air waybill needs pieces and the nature of goods.
8. **Added: "Air waybill data (illustrative)"** block on air bookings, with the fields an AWB needs. It says plainly that nothing is connected.
9. **Added: carrier company switcher ("Acting as")** next to the role switcher. Without it there is no way to approve a request for a specific carrier. Unverified carriers can be selected, to show that their listings stay hidden.
10. **Added: volume calculator and "Load demo shipment"** on the shipment form. **Reset demo data** in the footer (can be turned off).

## Implementation choices

- **Dates are date-only, UTC.** Seed dates are relative to the day the seed runs (`DEMO_READY_OFFSET_DAYS`, default 3). Re-run the seed or use Reset demo data before the demo.
- **Chargeable weight is rounded up to whole kg.** Money is rounded to cents.
- **Duplicate last listing** copies the carrier's most recent listing and moves the departure a week later. The quick picks (Tomorrow, In 3 days, In 7 days) then set the date.
- **Font:** Archivo variable (width axis) from `@fontsource-variable/archivo` instead of `next/font/google`. Same font, but it needs no network at build time.
- **Schema:** `prisma db push` instead of migrations. Fine for a demo with seeded data.
- **Ties in the decision layer** go to the lower price, then the shorter transit.
- **Recommendation text** when the recommended offer is slower or within half a day of the cheapest: "...with a similar transit time" (no per-day figure).
- **Capacity reserved on approval, not on request.** Two requests can compete for the same space. Approval re-checks capacity in one database statement, so the second one fails with a clear message.

## Security (demo-appropriate)

- The role cookie is signed (HMAC) and httpOnly. It selects a role, it does not authenticate anyone.
- Every server action checks role and ownership on the server. Carrier company and shipper company always come from the session, never from the request.
- Unverified carriers are filtered in the database query and again when a booking is requested. A unit test covers the rule.
- Input is validated with zod on the server. No `dangerouslySetInnerHTML`.
- Optional passcode gate (`DEMO_PASSCODE`) for shared links, with a small attempt limiter. The gate page is GET-only and sits outside the app layout, so server actions cannot be reached through it.
- Security headers (CSP, frame, content type, referrer, permissions) and `noindex`.
- **Not done:** real authentication, per-user accounts, durable rate limiting (use the host's firewall), audit log. The README says so.
