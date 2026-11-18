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

The site and the app share one look. If you change it, change it in `tailwind.config.ts` and `src/app/globals.css` so both follow.

- **Colors:** Paper `#F4F6F9`, Panel `#FFFFFF`, Ink `#111827`, Rule `#D3D9E2`. Mode colors only mean a mode: Air `#1D4ED8`, Rail `#0F766E`, Road `#B45309`, Sea `#6D28D9`. Good `#15803D`, Bad `#B91C1C`. Do not use a mode color as decoration.
- **Type:** Archivo (variable). Condensed width (`.condensed`, `.display`) for airport codes, big numbers and headlines, normal width for text. Numbers use tabular figures.
- **Pictures:** the site is drawn in code, and the load view lays positions over vehicle pictures (`PHOTOS.md`). A new picture must not show any real company name, logo, livery or readable registration.
- **Shape:** one 6 px radius. No gradients. No decorative shadows.
- **Motion:** respect `prefers-reduced-motion`. Nothing loops forever.
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
node scripts/a11y-check.mjs   # accessibility scan (axe) of the main screens
node scripts/story-check.mjs  # the scroll story: transitions, photos, reduced motion, phone
```

For the browser scripts, start the app with `npm run build && npm start` and run them with `BASE_URL=http://localhost:3000`. Reseed (`npm run db:seed`) before each one.
