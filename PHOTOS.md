# Pictures

## Photographs on the home page

The "Four ways" block (`src/components/site/home/Modes.tsx`) and the statement (`Statement.tsx`) use four photographs from [Pexels](https://www.pexels.com). The Pexels licence allows free commercial use and does not require credit; the page credits them anyway. They are local files (the site only loads images from itself).

| File in `public/photos/` | Shows | Pexels photo ID | Edits |
|---|---|---|---|
| `sky-*.webp` | Wing over the clouds | 18813721 | Cropped to 16:9 |
| `sea-*.webp` | Container ship from above | 12530458 | Cropped to 16:9 |
| `road-*.webp` | Truck from above | 9195241 | Rotated to level the road, cropped, two small company marks on the trailer painted over |
| `rail-*.webp` | Rail yard at dusk | 13876842 | Cropped to 16:9 |

Each exists at 1280 and 1920 pixels wide; the page picks one with `srcset`. The address of a photo is `https://www.pexels.com/photo/<ID>/`.

The design follows the layout of a studio template the owner chose (column lines, sticky left column, large type). Nothing was copied from it: no images, text or files. Do not put files from the template's site into `public/`.

## The rule for any picture

**No picture may show a real company's name, logo or livery, and no readable aircraft registration.** This is the same rule as for the rest of the site: no real airline, carrier or forwarder, and no implied integration. The vehicles in `Vehicles.tsx` (used by the race and the load view) are generic on purpose, and their containers carry colors only, no logos.

Pictures that were supplied or found and not used because of this rule: container-ship side views with real shipping lines' logos, a company name and a stock-site watermark, an airliner with an airline livery and registration, and a wagon drawing with a CAD site's watermark and real railway markings.

## Vehicle pictures in the load view

The truck and the ship are drawn in code (`TruckArt`, `ShipArt` in `src/components/site/Vehicles.tsx`), so they stay sharp at any size. The aircraft, the wagon and the container are still pictures:

`public/vehicles/` holds the pictures the load view lays its positions over. They were supplied by the project owner as **placeholders for the demo** and are **not cleared for public or commercial use**. Replace them before the site is shown publicly or sold.

| File | Shows | Where it came from | What was done |
|---|---|---|---|
| `plane.webp` | Freighter, side view, plain white | A free-to-view aircraft illustration from a blog | Upper drawing cropped, the second drawing cut away, background made transparent |
| `container.webp` | Open red container, side cutaway | A 3D render without watermark, supplied by the project owner | Cropped, background made transparent |
| `wagon.webp` | Box wagon, side view, line drawing | A line drawing supplied by the project owner | The upper wagon cropped, background made transparent |

Open points before going public: the licence of each picture and whether the truck cab resembles a real manufacturer's model closely enough to matter. The ship in the load view is drawn in code (`ShipArt`) (`src/components/LoadView.tsx`). To change a picture, replace the file and update its entry in `PHOTOS` at the top of that component (the box where positions go, in pixels of the picture).
