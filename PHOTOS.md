# Pictures

## Photographs on the home page

The "Four ways" block (`src/components/site/home/Modes.tsx`), the statement (`Statement.tsx`) and the first step of the new-shipment page (`src/components/shipper/ModeChooser.tsx`) use four photographs from [Pexels](https://www.pexels.com). The Pexels licence allows free commercial use and does not require credit; the page credits them anyway. They are local files (the site only loads images from itself).

| File in `public/photos/` | Shows | Pexels photo ID | Edits |
|---|---|---|---|
| `sky-*.webp` | Wing over the clouds | 18813721 | Cropped to 16:9 |
| `sea-*.webp` | Container ship from above | 12530458 | Cropped to 16:9 |
| `road-*.webp` | Truck from above | 9195241 | Rotated to level the road, cropped, two small company marks on the trailer painted over |
| `rail-*.webp` | Rail yard at dusk | 13876842 | Cropped to 16:9 |

Each exists at 1280 and 1920 pixels wide; the page picks one with `srcset`. The address of a photo is `https://www.pexels.com/photo/<ID>/`.

The design follows the layout of a studio template the owner chose (column lines, sticky left column, large type). Nothing was copied from it: no images, text or files. Do not put files from the template's site into `public/`.

## Video loops in "Four ways"

Air and Road play short silent loops (`public/videos/`), from [Mixkit](https://mixkit.co), each checked on its page to be under the **Mixkit Stock Video Free License** (commercial use allowed, no credit required; the page credits Mixkit anyway). Many Mixkit clips are under the *Restricted* licence (personal use only): never use those.

| File | Shows | Mixkit clip | Edits |
|---|---|---|---|
| `air.mp4` | Clouds through a plane window | 4368, "Sky through a plane window" | Cropped to leave out the engine (its colour could suggest an airline), 8 s, 960×540, no sound, the end fades into the start so it loops without a jump |
| `road.mp4` | Trucks on a winding road, from above | 52434, "Transport trucks gliding over black asphalt road among arid vegetation" | 8 s, 960×540, no sound, seamless loop |

Sea and Rail are still photos with a slow camera drift: the free-licence clips found either showed a shipping line's name on the containers or were under the restricted licence. To swap one in: check the licence on the clip's page, look at a frame every second at full size for names and logos, then make the loop with ffmpeg (trim about 9 s, scale to 960×540, `-an`, crossfade the last second into the first, H.264 CRF about 27, `+faststart`), save a poster frame as WebP, and add `video: "<name>"` to the mode in `Modes.tsx`.

The videos load only while on screen, never with sound, and stop with the Pause motion button; with reduced motion they show their poster.

The new-shipment page uses the same two loops on its large card. For sea and rail it blurs the photo and draws a ship (`ShipArt`) or a train (`TrainArt`) travelling in front, until clean clips are found.

## The rule for any picture

**No picture may show a real company's name, logo or livery, and no readable aircraft registration.** This is the same rule as for the rest of the site: no real airline, carrier or forwarder, and no implied integration. The vehicles in `Vehicles.tsx` (used by the race and the load view) are generic on purpose, and their containers carry colors only, no logos.

Pictures that were supplied or found and not used because of this rule: container-ship side views with real shipping lines' logos, a company name and a stock-site watermark, an airliner with an airline livery and registration, and a wagon drawing with a CAD site's watermark and real railway markings.

## Vehicle pictures in the load view

All five vehicles in the load view are drawn in code in `src/components/site/Vehicles.tsx`, so they stay sharp at any size and there is nothing to license: `TruckArt`, `ShipArt`, `FreighterArt` (a freighter with its main deck cut open), `WagonArt` (a covered wagon with its side open) and `ContainerFlatArt` (a 40 ft container with its side open, on a flat wagon). The wagon and the container show the inside in perspective (back wall, floor, ends), so the positions read as standing inside.

To change where the positions go, edit the `area` of that vehicle in `PHOTOS` at the top of `src/components/LoadView.tsx` (in units of the drawing's viewBox).

Until November 2026 the aircraft, the wagon and the container were pictures supplied by the project owner as placeholders, not cleared for public use. They were replaced by the drawings and removed from `public/vehicles/`. Open point that remains: whether the drawn truck cab resembles a real manufacturer's model closely enough to matter.
