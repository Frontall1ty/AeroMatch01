# Photos

The scroll story on the home page (`src/components/site/Story.tsx`, `src/app/story.css`) uses four photographs from [Pexels](https://www.pexels.com). The Pexels licence allows free commercial use and does not require credit. We credit them anyway (the line at the bottom of the story).

| File in `public/photos/` | Scene | Pexels photo ID | Edits |
|---|---|---|---|
| `sky-*.webp` | Air: wing in the sky | 18813721 | Cropped to 16:9 |
| `sea-*.webp` | Sea: container ship from above | 12530458 | Cropped to 16:9 |
| `road-*.webp` | Road: truck from above | 9195241 | Rotated about 37° to level the road, cropped to 16:9, two small company marks on the trailer painted over |
| `rail-*.webp` | Rail: rail yard at dusk | 13876842 | Cropped to 16:9 |

Each photo exists in two sizes, `-1280.webp` and `-1920.webp`. The page picks one with `srcset`.
The page address of a photo is `https://www.pexels.com/photo/<ID>/`.

## The rule for new photos

**No photo may show a real company's name, logo or livery, and no readable aircraft registration.** This is the same rule as for the rest of the site: no real airline, carrier or forwarder, and no implied integration.

Photos that were looked at and rejected for this reason: an airliner with a visible airline tail (Pexels 29057221), a locomotive in a real railroad's colours (5793667), a cargo airliner with an airline name (19912350), a tank car with a leasing company's mark (19323203), a truck with a company logo (14005602), and an airliner from below with a registration and tail stripe (32155436).

To change a photo: save the original in a scratch folder (not in the repository), crop to 16:9, export both widths as WebP (quality about 76), look at the full-size result for text and logos, then replace the files here and update the table above.

## What is not a photo

The load view (the cutaway of a truck, aircraft, wagon, container or ship with the booked, your and free positions) is drawn in code (`src/components/LoadView.tsx`). A photographic cutaway would need isolated side-view pictures of each vehicle.
