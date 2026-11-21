# Working on AeroMatch

For anyone who joins the project, for example to design the public site. Read this first.

## Two rules before anything else

1. **Never share a password.** Not for Gmail, GitHub or Vercel. Ask the owner to add you as a collaborator instead (see "Getting access"). Shared passwords cannot be taken back and hide who changed what.
2. **Work on a branch, never on `main`.** `main` is what Vercel publishes. A branch can be reviewed first.

## Getting access

- **GitHub:** the owner opens the repository, then Settings, Collaborators, Add people, and enters your own GitHub username. You accept the invitation by email.
- **Vercel:** you do not need access. The owner publishes your work by merging your branch. (On Vercel's free plan other people's commits do not deploy by themselves, so a preview link will not appear for your branch.)
- **Database:** you do not need the production database. Run your own copy on your computer (below).

## Run it on your computer

You need Node.js 20 or newer, Git and PostgreSQL.

```bash
git clone https://github.com/Frontall1ty/AeroMatch01.git
cd AeroMatch01
npm install
cp .env.example .env
```

Edit `.env`: set `DATABASE_URL` to your local PostgreSQL (for example `postgresql://user:password@localhost:5432/aeromatch`) and `SESSION_SECRET` to any long text. Then:

```bash
npm run db:push     # create the tables
npm run db:seed     # load the invented demo data
npm run dev         # http://localhost:3000
```

Demo accounts without a password are at http://localhost:3000/demo.

## Branches and pull requests

```bash
git checkout -b site/new-hero          # a short name that says what you do
# ...work...
git add -A
git commit -m "Site: new hero layout"
git push -u origin site/new-hero
```

Then open the repository on GitHub and press **Compare & pull request**. The owner reviews and merges it.

Before you push, run `npm test` and `npm run build`. Both must pass.

## Who edits what

To avoid two people changing the same file, stay inside your area.

| Area | Files | Who |
|---|---|---|
| Public site and its look | `src/app/(site)/`, `src/components/site/`, `src/app/globals.css`, `tailwind.config.ts` | Site designer |
| The app (shipper and carrier screens) | `src/app/(app)/`, `src/components/` (not `site/`) | Owner and Claude |
| Rules, pricing, accounts, database | `src/lib/`, `src/app/actions.ts`, `src/app/auth-actions.ts`, `prisma/` | Owner and Claude. **Do not edit** |

Need a change outside your area? Open an issue or ask the owner.

## The look: keep these

The site follows the layout grammar of a studio template the owner chose: thin column lines, a sticky title column on the left with rows on the right, large display type, full-bleed photographs with glass, a numbered label on every section, and a big wordmark in the footer. Light sections (white and warm grey) alternate with graphite ones; the app screens are light, the admin is graphite. Change the look in `tailwind.config.ts` and `src/app/globals.css` so everything follows; site-only rules are in `src/app/site.css`.

- **Colors (tokens in `tailwind.config.ts`):** Paper `#F3F3F1`, Panel `#FFFFFF`, Ink `#0E0E10`, Muted `#56565C`, Rule `#DCDCD6`. Graphite surfaces `console` `#0E0E10`, `console-raised` `#18181B`, `console-rule` `#2C2C30`, text `#F4F4F2` and `#A1A1A8`.
- **One accent, Signal orange `#FF5B1F`** (`signal`, and `ion-bright` on dark). Marks, featured buttons, the stats band, highlighted cards. Text on it is always Ink (white fails contrast). Never use it as text on a light surface. Primary buttons on light surfaces are Ink (`btn`); on dark they are Signal (`btn-bright`).
- **Mode colors only identify a mode:** Air `#2F4FD0`, Sea `#6D3FD0`, Rail `#237A35`, Road `#8A5A00` (ochre, so it never reads as the accent). They live in `tailwind.config.ts`, `MODE_HEX` and `MODE_HEX_BRIGHT` (for dark surfaces) in `src/lib/constants.ts`; change them together and keep them AA on white and on Paper.
- **Type:** Cal Sans for display (`.display`, `.h-wide`, `font-display`), DM Sans for text, condensed Archivo for numbers and airport codes (`.condensed`). Body text is 16 px or larger. Headlines turn tabular figures off, because Cal Sans would otherwise widen spaces and commas.
- **Glass:** `.glass` (dark, frosted), `.glass-deep` (darker, for text over photographs), `.glass-light`, and `.panel-dark` in the admin. Glass needs something behind it: the route map, a photograph, or `.aurora` (a soft orange light). Use `.aurora` on its own, never together with `.grid-dots`, which sets the same background.
- **Labels and grid:** `site-label` (orange mark and a numbered name), `col-lines` (four column lines on a relative wrapper), `route-rule`.
- **Motion:** the route map draws in, then traffic keeps moving on it (planes, ships, trucks and trains, each only on a lane where that mode runs: `heroLanes.ts`, checked by a test). The statement's words and the mode marquee follow the scroll. Anything that moves by itself must stop with the **Pause motion** button (`MotionToggle`, WCAG 2.2.2), and with reduced motion it starts paused and the traffic is not drawn. Buttons lift, glow and slide their arrow only on devices that hover, and the same on keyboard focus.
- **Shape:** 4 px radius for controls, 8 px for cards and photos.
- **The new-shipment page is a showroom, then a form.** Step 1 (`ModeChooser`) shows one way to ship large and the other three small, with a glass bar on the large card. The large card shows the vehicle on its way: the plane crosses the sky video, road plays its video, and for sea and rail (no clean video yet) the photo goes soft behind a drawn ship on running water and a drawn train on its track. Never put a drawn vehicle over a sharp photo of a real one: it looks pasted on. **Look inside**, or a click on the card, cuts the roof off and shows the cargo space as a real-time 3D model (`HoldView` → `Hold3D` → `src/three/`): a freighter, a container ship on the water, a covered wagon on 1,520 mm track and a tractor with a curtain-sided trailer, the cut faces filled in orange, the cargo (crates, pallets or cars) dropping in and lifting when pointed at; "Angled", "From above", Turn left and Turn right, or drag to turn. three.js loads only when a model comes into view and draws only while something moves. Without WebGL, or if the context is lost, the isometric SVG drawing is shown instead. Step 2 (`ShipmentStudio`) is the form with the same cutaway beside it, filled as the shipper types. The sizes of the holds are round figures for the picture (`src/lib/holds.ts`), never a loading plan, and the boxes are placed by `fitGrid`, the same rule the space calculator uses. The plane stops with **Pause motion** and does not move with reduced motion.
- **Words:** plain English, sentence case, the same name for the same action everywhere ("Request booking", "Approve", "Add capacity"). Never write "AI-powered". Never write a real airline, carrier or company name, never imply a real integration, and no invented testimonials, ratings, client logos or prices for AeroMatch itself.

## Honesty rules for the content

- Every price, carrier and capacity is **invented demo data**, and every screen that shows prices has the "Demo data" tag.
- The handling safety score is a **demo estimate**. Say so wherever it is shown.
- The site must not claim something the app does not do.

## Checks you can run

```bash
npm test                 # unit tests for the rules
npm run build            # the production build
npm run demo:check       # the whole demo script in a browser (needs the app running, and Playwright)
node scripts/a11y-check.mjs   # accessibility scan (axe) of the main screens; with ADMIN_PASSCODE set on the server and in the shell it scans the admin too
```

For the browser scripts, start the app with `npm run build && npm start` and run them with `BASE_URL=http://localhost:3000`. Reseed (`npm run db:seed`) before each one.
