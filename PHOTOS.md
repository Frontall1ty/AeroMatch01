# Pictures

The home page uses **no photographs** any more. The scroll story, the race and the shipment board are drawn in code (`src/components/site/Vehicles.tsx`, `Story.tsx`, `Race.tsx`, `Board.tsx`, `src/app/story.css`). The first version of the story used four Pexels photographs; it was replaced because flat drawings in one style looked better with the rest of the site.

## The rule for any picture

**No picture may show a real company's name, logo or livery, and no readable aircraft registration.** This is the same rule as for the rest of the site: no real airline, carrier or forwarder, and no implied integration. The vehicles in `Vehicles.tsx` are generic on purpose, and their containers carry colors only, no logos.

Pictures that were supplied or found and not used because of this rule: container-ship side views with real shipping lines' logos, a company name and a stock-site watermark, an airliner with an airline livery and registration, and a wagon drawing with a CAD site's watermark and real railway markings.

## Vehicle pictures in the load view (placeholders)

`public/vehicles/` holds the pictures the load view lays its positions over. They were supplied by the project owner as **placeholders for the demo** and are **not cleared for public or commercial use**. Replace them before the site is shown publicly or sold.

| File | Shows | Where it came from | What was done |
|---|---|---|---|
| `truck.webp` | Semi-trailer, side view | A truck mock-up image (a stock mock-up site) | Cropped, background made transparent |
| `rigid.webp` | Box truck, side view | The same mock-up site | Cropped, background made transparent |
| `plane.webp` | Freighter, side view, plain white | A free-to-view aircraft illustration from a blog | Upper drawing cropped, the second drawing cut away, background made transparent |
| `container.webp` | Open red container, side cutaway | A 3D render without watermark, supplied by the project owner | Cropped, background made transparent |
| `wagon.webp` | Box wagon, side view, line drawing | A line drawing supplied by the project owner | The upper wagon cropped, background made transparent |

Open points before going public: the licence of each picture and whether the truck cab resembles a real manufacturer's model closely enough to matter. The ship in the load view is drawn in code (`ShipArt`) (`src/components/LoadView.tsx`). To change a picture, replace the file and update its entry in `PHOTOS` at the top of that component (the box where positions go, in pixels of the picture).
