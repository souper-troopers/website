# Souper Troopers Website

## Stack (decided 2026-08-08 — do not change without asking the user first)
- **Framework:** Astro
- **Interactivity:** Svelte 5, using **runes** syntax (`$state`, `$derived`, etc.) — not Svelte 4 stores or `export let` reactive statements. If unsure which syntax an example uses, default to runes.
- **Content:** Sanity (headless CMS), project `wqa0no5g` / dataset `production`. Schema lives in `studio/schemaTypes/` in this repo; content lives in Sanity's hosted dataset, fetched at build time via `src/lib/sanity.ts`. Live since 2026-08-08 — six types (`successStory`, `teamMember`, `partner`, `product`, `impactStat`, `siteSettings`), all wired into the site's pages. Structural/rarely-changing copy (CAST steps, Humanity Hub services list, hero headline) intentionally stays hardcoded in `.astro` files, not in Sanity.
- **Hosting:** Vercel or Netlify (static/JAMstack deploy, auto HTTPS/CDN, no server to maintain).
- **Shop/checkout:** Stripe Checkout or Snipcart bolted onto static pages — not a full e-commerce backend.
- **Donations:** link out to the org's existing/new donation platform rather than building custom payment infra.

## Working agreement
- The user must be consulted before any tech/stack choice or change — do not swap frameworks, CMS, or hosting providers unilaterally.
- Content backups: a scheduled `sanity dataset export` (e.g. via a free GitHub Actions cron) should be set up once Sanity is live — this doubles as the migration path if ever needed.

## Account setup checklist
Reasoning: if these accounts are created under the user's personal logins, the charity doesn't actually own its own site — a volunteer does, on their behalf. Creating them as org/team resources from the start avoids a painful migration later and gives Souper Troopers itself ultimate control.
- [x] **GitHub**: create a GitHub *Organization* (not a personal repo) — done, `souper-troopers/website`. Repo is public (made public 2026-08-08 — nothing sensitive in it, and Netlify's free tier can't deploy private org-owned repos or add team members without a paid plan, so public was the pragmatic choice).
- [x] **Netlify**: deploying under a Team ("Souper Troopers"), not the user's personal account. Chose Netlify over Vercel because Vercel's free tier doesn't support Teams at all (Pro-only, ~$20/mo). Deployed to a temporary `*.netlify.app` URL — **not yet pointed at the real domain** (soupertroopers.org still serves the current live site until this redesign is approved).
- [ ] **Sanity**: deferred — creating a Sanity Organization requires payment details upfront, so we're starting under the user's personal account instead to avoid blocking schema/content work. Sanity supports transferring a project to an Organization later; **revisit this before real launch.**
- [ ] **Payment processor (Stripe/Snipcart)**: needed for real shop checkout — blocked on confirmed product pricing, stock, and fulfillment process (still-open Notion questions), not just the account itself.
- [ ] **Deploy the Sanity Studio** (`npx sanity deploy` from `studio/`) so Kerry/Shan can actually edit content — right now it only runs locally (`sanity dev`), so only the user can access it.

## Before real launch (pointing soupertroopers.org at this site)
- [ ] Remove the `<meta name="robots" content="noindex, nofollow">` tag in `src/layouts/Layout.astro` — added 2026-08-08 so search engines don't index the pre-launch preview URL under the wrong domain.
- [ ] Point the real domain at Netlify and update DNS.
- [ ] Transfer the Sanity project from the user's personal account to a Sanity Organization.

## Content still needed
- **Shop pricing & fulfillment**: no confirmed prices, stock/inventory approach, or who fulfils orders (volunteer/staff/automatic) — see the open "What products do we sell" / "How are orders fulfilled" questions in the Website Discovery Notion doc. The Shop page currently uses an email-based order-request form (`src/components/OrderForm.svelte`) instead of real checkout because of this.
- **Video for the homepage hero**: current hero uses a real photo (`dignity-moment.jpg`), not video. Two source videos exist in `../souper-troopers-media/Content/Videos/` but neither is hero-ready: `Capital International Group - CSI Partner.mov` is 933MB / 7 min (a narrated piece, better suited to a "watch our story" section than a silent autoplay background), and `Anthony - Cast Model.mp4` is 92MB / 75s but portrait-oriented. Both also exceed GitHub's 100MB file-size limit, so raw files can't be committed to this repo regardless. Needs either: short (5-15s), silent, heavily-compressed (~2-3MB) b-roll shot specifically for a hero background, or the existing long-form videos uploaded to YouTube/Vimeo (unlisted) and compressed, then embedded as a click-to-play "watch our story" section (not autoplay).

## Source of truth for requirements
Website scope/requirements come from the "🌐 Souper Troopers — Website Discovery" Notion database, not from files in this repo. Access via the Notion MCP connection (see `.mcp.json`). Check it for current answered/open questions before assuming scope is settled.

## Repo layout
- `docs/` — planning docs: site structure & visitor journeys, client-facing proposal, design-inspiration notes.
- `wireframes/` — early static HTML wireframes (reference only; superseded by the real Astro build as pages land).
- `src/` — the actual Astro/Svelte site.
- Media assets (photos, videos, logos, brand PDFs, product one-pagers) live in a sibling directory, `../souper-troopers-media/`, not in this repo.

## Development
When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation
Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:
- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
