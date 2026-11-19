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

The site, the app and the admin share one look: a monochrome, editorial dispatch console, after a studio template (black, white and light-grey surfaces, a visible four-column grid of thin lines, large light headlines) with frosted glass on top. The top and bottom of the site, the scroll story, the shipment board and the whole admin are dark; the screens where people read numbers and fill forms (compare, new shipment, bookings) are light. Change the look in `tailwind.config.ts` and `src/app/globals.css` so everything follows.

- **Colors (tokens in `tailwind.config.ts`):** light surfaces Paper `#F1F1F1`, Panel `#FFFFFF`, Ink `#0A0A0A`, Rule `#D9D9D9`. Dark surfaces `console` `#0A0A0A`, `console-raised` `#161616`, `console-rule` `#2E2E2E`, text `#F2F2F2` and `#A3A3A3`. There is no accent color: the action color (`ion`) is black on light surfaces and white on dark ones.
- **Mode colors are the only colors in the interface** and only ever identify a mode: Air `#2F4FD0`, Sea `#6D3FD0`, Rail `#237A35`, Road `#C2410C`. They live in `tailwind.config.ts` and in `MODE_HEX` in `src/lib/constants.ts`; change both together, and keep them AA on white and on Paper. `MODE_HEX_BRIGHT` is the same set for the dark charts.
- **Type:** DM Sans for text and headlines (headlines are weight 500 with tight tracking: `.display`, `.h-wide`). Archivo, condensed (`.condensed`), for numbers and airport codes. Body text is 16 px or larger, at AA contrast. Small uppercase labels are used sparingly, as the template does.
- **Glass:** `.glass` and `.panel-dark` (dark, frosted), `.glass-light` (light, frosted). Glass only works where something sits behind it, so dark areas have `.aurora` (soft light) and the story has its scenery. Keep enough opacity that text stays AA: the scan (`a11y-check`) catches a header that is too see-through.
- **Dark areas:** put `on-dark` on the wrapper (it brightens the focus ring and the form labels). Put `on-light` on a light panel placed inside a dark area. Buttons on dark are `btn-bright` and `btn-ghost`.
- **Grid and marks:** `col-lines` draws the four-column lines on a relative wrapper; `ticks` puts corner marks on key panels; `route-rule` is the thin line above big headlines; `grid-dots` is a dot grid.
- **Shape:** 4 px radius. No decorative shadows except under glass.
- **Motion:** respect `prefers-reduced-motion`. Nothing loops forever.
- **Header height:** the scroll story sticks under the header (`--story-top: 61px` in `src/app/story.css`). If you change the header height, change that number too, and run the story check.
- **Words:** plain English, sentence case, the same name for the same action everywhere ("Request booking", "Approve", "Add capacity"). Never write "AI-powered". Never write a real airline, carrier or company name, and never imply a real integration.

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
node scripts/story-check.mjs  # the scroll story: transitions, photos, reduced motion, phone
```

For the browser scripts, start the app with `npm run build && npm start` and run them with `BASE_URL=http://localhost:3000`. Reseed (`npm run db:seed`) before each one.
