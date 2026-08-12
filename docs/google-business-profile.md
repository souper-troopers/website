# Google Business Profile — prepared listing content

**Status: not created (as of 2026-08-12). Nobody has confirmed whether a listing already exists.**

This document is the content to paste into the listing. It is not something that can be built in this
repo — see "Why this isn't code" below.

**Kerry-facing version: `/google-listing` on the site itself** (`src/pages/google-listing.astro`),
linked from the Google-listing question on `/request-for-comment`. Same content as a plain-language
walkthrough, in the site's own styling, with a copy button on the description. This document is the
developer-facing source; that page is what Kerry actually reads.

It is `noindex` *and* excluded from the sitemap `filter` in `astro.config.mjs` — both are needed, since
the sitemap only governs what's advertised. **Keep the two files in sync**: the opening hours are
imported from `src/lib/opening-hours.ts` and the character count is measured at build time, but the
address, categories and description text are duplicated between here and the page.

An earlier standalone artifact version (`claude.ai/code/artifact/83b7363e-…`) is **superseded** by the
site page and was never shared.

## Why this matters more than the website for one specific search

Search `homeless charities cape town` and the top of the results page is a map with three businesses
beside it (the "local pack"), followed by listicles. **None of that block is drawn from anybody's
website.** It comes from Google Business Profile, a free listing an organisation claims and fills in
itself.

This is why the site's own SEO work — per-product pages, structured data, rewritten titles — cannot
by itself fix the search the user actually ran. The two are complementary: the listing wins the map
block, the site wins the ordinary blue links below it, and Google cross-checks one against the other.

## Why this isn't code

Every step below needs a Google account and, at the verification stage, proof of association with the
organisation (Google picks the method — postcard to the physical address, phone, email, or a video
call showing the premises). Postcard verification takes roughly 5–14 days. None of that can be
automated from this repo, and it shouldn't be: the account that owns the listing controls how Souper
Troopers appears on Google Maps indefinitely.

**Create it under an organisation Google account, not a personal Gmail.** Same reasoning as the rest
of the account checklist in `AGENTS.md` — if it's claimed on a volunteer's personal login, the charity
doesn't control its own map presence, and recovering a listing from a departed volunteer is
substantially harder than recovering a GitHub repo. Add Kerry and Shan as Owners (not Managers) once
it exists, so no single account is a point of failure.

## First: check whether one already exists

Search Google Maps for "Souper Troopers" and for the address. Three possible outcomes:

1. **A claimed listing exists** — someone has the login. Audit it against the content below.
2. **An unclaimed listing exists** — Google auto-generates these from other sources. It will show a
   "Claim this business" link. Claiming is the same verification flow as creating.
3. **Nothing exists** — create it.

Outcome 2 is common and easy to mistake for outcome 3. Check before creating, because a duplicate
listing splits the signals and then has to be merged, which is slower than claiming.

## The content to enter

Everything below matches what the website says. **Consistency is the point** — Google compares the
listing against the site, and a mismatched address or hours actively undermines both.

| Field | Value |
| --- | --- |
| **Name** | `Souper Troopers` |
| **Address** | `66 Newmarket Street, Woodstock, Cape Town, 7925, South Africa` |
| **Website** | The live domain once launched — **not** the `netlify.app` preview URL |
| **Phone** | **Missing — blocked.** No phone number exists on the current site, the new site, or anywhere findable. See "Open items" |
| **Primary category** | `Non-profit organization` |
| **Hours** | Mon–Thu 08:30–16:00, Fri 08:30–15:00, Sat–Sun closed |
| **Attribute** | Set **"by appointment only"** — visits are not drop-in |

Confirm the postal code before entering it; `7925` is Woodstock's general code and has not been
verified against this specific street address.

### Secondary categories

Pick from what Google actually offers (its list is fixed and changes periodically). Likely fits, in
rough priority: `Charity`, `Social services organization`, `Volunteer organization`, `Non-profit
organization`. Add only what is genuinely accurate — a category that oversells (e.g. anything implying
a shelter or residential facility) causes the wrong visits, which for this organisation is a real cost
rather than a wasted click.

### Description

750-character limit. This one is 726 (measured from the rendered text, not the source):

> Souper Troopers is a Cape Town non-profit working alongside people experiencing homelessness. We
> started with soup and conversation on the streets, and grew into the Humanity Hub in Woodstock,
> where our CAST programme — Connect, Assess, Support, Transform — walks with people from a first
> conversation through to skills training, identity documents and steady work.
>
> We accept donations of clothing, toiletries, linen, household goods and non-perishable food, and we
> welcome volunteers and corporate partners. Our social enterprise, Shmiley, sells Troopers Coffee and
> handmade African Worry Dolls made by people the programme has supported, with income going back into
> the work.
>
> Visits to the Humanity Hub are by appointment.

Check this against Kerry's own framing before publishing — it uses "people experiencing homelessness"
throughout, consistent with the site's on-page copy, and is still open to her veto (see the wording
question on the request-for-comment page).

### Photos

The single most-neglected part of most listings, and it visibly affects whether people click. Needed:

- **Logo** — `src/assets/images/logo-reversed.png` (or the original from `../souper-troopers-media/`)
- **Cover photo** — landscape, ideally the Humanity Hub or the Mandela mural
- **Exterior shot of 66 Newmarket Street** — genuinely useful, since it is how someone with an
  appointment recognises the right door. Does not currently exist anywhere in the media directory.
- **A handful of interior / work-in-progress / product photos**

Note this overlaps the existing "higher-resolution photos" ask to Kerry — the product photos inherited
from WooCommerce are ≤600px and too small to use here.

## After it's live

- **Add the site's real URL**, not the preview one. Doing this before launch points the listing at a
  `noindex` preview.
- **Get listed in the listicles.** "Top charities in Cape Town" round-ups rank for the target query far
  more easily than the site will. Being *in* them beats trying to outrank them.
- **Ask for reviews** from corporate partners and volunteers. Review count and recency feed the local
  pack ordering directly, and this organisation has a genuinely willing pool of people to ask.
- **Post occasionally.** GBP has a posts feature; listings that update rank better than dormant ones.
  The Souper News issues are ready-made material.

## Open items

1. **Phone number** — none exists publicly. Asked on the request-for-comment page, with the option to
   confirm they'd rather stay email-only. If they do, the listing works without one, but it costs some
   local ranking and some clicks.
2. **Postal code** — `7925` unverified for this street address.
3. **Whether a listing already exists** — unresolved; needs someone signed into Google Maps to look.
4. **Exterior photo of the Hub** — doesn't exist in the media directory.
