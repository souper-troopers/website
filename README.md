# Souper Troopers website

The website for [Souper Troopers](https://soupertroopers.org), a Cape Town NPO working with people
experiencing homelessness through the CAST programme and the Humanity Hub.

This is a rebuild of the existing site. It is **not live yet** — it runs at a preview URL and carries
a `noindex` tag until the real domain is pointed at it.

| | |
| --- | --- |
| Preview site | https://souper-troopers.netlify.app |
| Content editor (Sanity Studio) | https://souper-troopers.sanity.studio |

## Stack

- **[Astro](https://docs.astro.build)** — static site, pre-rendered at build time
- **[Svelte 5](https://svelte.dev/docs/svelte/what-are-runes)** for the interactive parts (cart,
  checkout, copy buttons), using **runes** (`$state`, `$derived`) — not Svelte 4 stores
- **[Sanity](https://www.sanity.io)** as the CMS. Schema lives in `studio/`, content lives in
  Sanity's hosted dataset and is fetched at build time
- **Netlify** for hosting, plus two serverless functions handling **PayFast** checkout
- No database, no server to maintain

## Getting started

```sh
npm install
npm install --prefix studio
npm run dev
```

That starts three processes together, colour-coded in one stream (Ctrl+C stops all three):

| | |
| --- | --- |
| `:4321` | Astro dev server |
| `:3333` | Sanity Studio |
| `:8888` | `netlify dev` — the Astro site **plus** the serverless functions |

### ⚠️ Browse `http://localhost:8888`, not `:4321`

`:4321` is the raw Astro server and knows nothing about `netlify/functions/`, so anything calling
`/.netlify/functions/*` — most visibly the shop checkout — will 404 there. `:8888` serves the same
site with the functions layered on top. This catches people out often enough that it is worth
repeating: **use `:8888`**.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Astro + Studio + functions together (browse `:8888`) |
| `npm run build` | Typecheck, then build to `./dist/` |
| `npm run check` | Typecheck only |
| `npm run preview` | Serve the built site locally |

`npm run build` runs `astro check` first, so a type error fails the build rather than shipping.

## Layout

```text
src/
  pages/         routes — each .astro file is a URL
  components/    Astro and Svelte components
  layouts/       Layout.astro — shell, global styles, palette tokens, SEO tags
  lib/           Sanity client and queries, cart state
studio/          Sanity Studio — schema definitions (its own package)
netlify/         serverless functions (PayFast payment + ITN webhook)
docs/            planning notes and decision write-ups
wireframes/      early static mockups, superseded by the real build
```

Media (photos, video, brand assets) lives in a sibling `../souper-troopers-media/` directory,
deliberately outside this repo.

## Contributing

Day-to-day work happens on **`dev`**. Push there freely — it costs nothing.

Merging `dev` → `main` triggers a production deploy, so merge when a batch is genuinely ready to
ship rather than per commit.

Two scheduled GitHub Actions workflows back this up: a weekly Sanity dataset backup to a private
repo, and a Studio deploy that fires when `studio/**` changes.

## Where the reasoning lives

**[AGENTS.md](AGENTS.md)** is the decisions log — why the stack is what it is, what has already been
tried and rejected, and the non-obvious traps. It is considerably more detailed than this file, and
worth reading before changing anything structural. If you are about to be surprised by something,
the explanation is probably already in there.
