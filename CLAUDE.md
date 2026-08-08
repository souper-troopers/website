# Souper Troopers Website

## Stack (decided 2026-08-08 — do not change without asking the user first)
- **Framework:** Astro
- **Interactivity:** Svelte 5, using **runes** syntax (`$state`, `$derived`, etc.) — not Svelte 4 stores or `export let` reactive statements. If unsure which syntax an example uses, default to runes.
- **Content:** Sanity (headless CMS). Schema lives in this repo's code; content lives in Sanity's hosted dataset, fetched at build/query time.
- **Hosting:** Vercel or Netlify (static/JAMstack deploy, auto HTTPS/CDN, no server to maintain).
- **Shop/checkout:** Stripe Checkout or Snipcart bolted onto static pages — not a full e-commerce backend.
- **Donations:** link out to the org's existing/new donation platform rather than building custom payment infra.

## Working agreement
- The user must be consulted before any tech/stack choice or change — do not swap frameworks, CMS, or hosting providers unilaterally.
- Content backups: a scheduled `sanity dataset export` (e.g. via a free GitHub Actions cron) should be set up once Sanity is live — this doubles as the migration path if ever needed.

## Account setup checklist (do this before/while scaffolding — not yet started)
Reasoning: if these accounts are created under the user's personal logins, the charity doesn't actually own its own site — a volunteer does, on their behalf. Creating them as org/team resources from the start avoids a painful migration later and gives Souper Troopers itself ultimate control.
- [ ] **GitHub**: create a GitHub *Organization* (not a personal repo) — e.g. `souper-troopers`. Free. Add the user as Owner to do the work, and add an accountable exec (e.g. Kerry) as Owner too, even though she won't touch code.
- [ ] **Vercel/Netlify**: create the hosting project under a Team, not the user's personal account.
- [ ] **Sanity**: create the project under a Sanity Organization, not the user's personal account.

## Source of truth for requirements
Website scope/requirements come from the "🌐 Souper Troopers — Website Discovery" Notion database, not from files in this repo. Access via the Notion MCP connection (see `.mcp.json`). Check it for current answered/open questions before assuming scope is settled.

## Repo layout
- `docs/` — planning docs: site structure & visitor journeys, client-facing proposal, design-inspiration notes.
- `wireframes/` — early static HTML wireframes (reference only; superseded by the real Astro build as pages land).
- Media assets (photos, videos, logos, brand PDFs, product one-pagers) live in a sibling directory, `../souper-troopers-media/`, not in this repo.
