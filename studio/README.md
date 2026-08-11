# Sanity Studio — Souper Troopers

The content editor for the [Souper Troopers website](../README.md). Kerry and Shan use this to
update team bios, success stories, partners, supporters, press mentions, impact figures and shop
items without a developer.

Live at **https://souper-troopers.sanity.studio** (gated behind Sanity login — users must be added
as project members first).

This is its **own npm package**, separate from the site. Its dependencies are not installed by the
root `npm install`.

```sh
npm install          # from this directory
npm run dev          # Studio alone, on :3333
```

More usually you want everything at once — `npm run dev` from the repo root starts the site, this
Studio and the Netlify functions together.

## Schema

Document types live in `schemaTypes/`, registered in `schemaTypes/index.ts`.

Some site copy is deliberately **not** editable here — the CAST step descriptions, the Humanity Hub
services list and the homepage headline are hardcoded in the `.astro` files. These are structural,
where an accidental edit would visibly break a layout.

## ⚠️ Editing schema is not enough — it must be deployed

`npm run dev` reads `schemaTypes/` straight off disk, so localhost is always current. The **hosted**
Studio is a separately built application and stays frozen at its last deploy. They drift silently
and nothing warns you.

Pushing schema changes to `main` now triggers a deploy automatically
(`.github/workflows/studio-deploy.yml`). To deploy by hand:

```sh
npx sanity deploy
```

Hard-refresh afterwards — the Studio caches its assets aggressively, so an ordinary reload can still
show the old schema.

## Two traps worth knowing

**Document IDs must not contain a dot.** Sanity treats any document whose `_id` contains a `.` as
private, readable only with an authenticated token. Such documents appear normally in this Studio
but the website's tokenless client silently gets `[]` back — no error, just an empty section. Use
hyphens or Sanity's generated ids.

**Content edits don't reach the live site on their own.** The site is statically built, so a publish
here changes nothing publicly until the site is rebuilt. That rebuild is deliberately manual — see
[AGENTS.md](../AGENTS.md) for why, and for the rest of the project's decisions.
