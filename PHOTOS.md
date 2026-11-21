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

**No picture may show a real company's name, logo or livery, and no readable aircraft registration.** This is the same rule as for the rest of the site: no real airline, carrier or forwarder, and no implied integration. The drawn vehicles in `Vehicles.tsx` (used by the race and the board) and the 3D models in `src/three/` are generic on purpose, and their containers carry colors only, no logos.

Pictures that were supplied or found and not used because of this rule: container-ship side views with real shipping lines' logos, a company name and a stock-site watermark, an airliner with an airline livery and registration, and a wagon drawing with a CAD site's watermark and real railway markings.

## 3D models on the new-shipment page

The freighter, the container ship, the covered wagon and the truck in the cargo-space view are built in code with three.js (`src/three/`: `plane.ts`, `ship.ts`, `rail.ts`, `truck.ts`). No model files and no image files are loaded: the textures (corrugated board, plank floor, tarpaulin, ribbed steel, ballast, ripples) are drawn on a canvas when the view opens, and the studio light is three.js's built-in room environment. So there is nothing to license and nothing comes from another site.

They are generic on purpose: no make, badge, airline or shipping-line colours, registration or railway markings. Container colours are a neutral mix.

They are not photographs. For a photoreal look, licensed model files (GLB) can replace a builder: each vehicle is one function that returns the group and the corner where the cargo starts. Check the licence allows commercial use, that the file shows no brand, and that its textures are embedded (the site's content security policy loads nothing from elsewhere).

## Vehicle pictures in the load view

The load view (compare rows, the booking drawer, the home page) shows each vehicle from the side with the positions laid over its cargo space. The pictures in `public/vehicles/` (`truck`, `plane`, `wagon`, `container`, `ship`, WebP) are rendered from the same 3D models as the new-shipment page, by `node scripts/render-stills.mjs`. The script also writes `src/lib/loadStills.ts`: each picture's size and the rectangle of its cargo space's back wall, in pixels, where the positions go. Run it again after changing a model. A page of offers cannot hold a live 3D view per row (browsers limit how many run at once), so these are still pictures.

They are our own renders of models built in code: nothing to license. Until November 2026 three of these were pictures supplied by the project owner as placeholders, not cleared for public use; they are gone. Open point that remains: whether the drawn truck cab in the race (`TruckArt`) resembles a real manufacturer's model closely enough to matter.
