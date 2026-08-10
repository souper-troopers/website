# Souper News — what's actually in it

Transcribed 2026-08-10 from the live site's `/souper-news/` page.

## The key finding

Souper News is **not 15 news items**. It is a **single 15-page magazine** — *Souper Troopers
Magazine, March 2026, "Healing & Human Rights Edition"* — published as 15 full-page PNG images
(1414×2000, A4 portrait). Every page carries the same March 2026 masthead, so there is one date
across the whole set. Page 15 credits **EF Ogle Productions** for images and design.

Consequences:

- **A reverse-chronological timeline would have exactly one node.** The pattern needs 5–6 dated
  items before it reads as a timeline rather than a list with a line next to it.
- **The text is baked into images.** None of it is selectable, searchable, translatable, or visible
  to a screen reader, and Google cannot index a word of it — which quietly undercuts the SEO/AEO
  work. On a 390px phone an A4 page renders body text at roughly 4pt.
- **The page ships ~37MB of PNGs** (measured across all 14 linked images), which is slow and
  expensive in data on a South African mobile connection.
- Only **8 of 14 pages carry text**; the other 6 are pure photo spreads.

No earlier issues exist on the site — the other numbered PNGs in the WordPress media library are
square (600×600, 500×500), i.e. logos and product shots, not magazine pages.

## Page-by-page

| Page | Content | Type | Where it belongs on the new site |
|---|---|---|---|
| 1 | Cover — "Healing & Human Rights Edition" | Cover | Issue archive only |
| 3 | **Volunteer Focus: Mark** — medical student; volunteering shaped a more holistic, empathetic approach to patients | Testimonial | Get Involved → volunteering |
| 4 | **Growth & Accountability** — CAST model explainer, plus **Unam's story**: CCID first cohort, upskilled as a barista, now working at a CBD café while on the Khulisa stipend | Success story | Our Work → success stories (Sanity `successStory`) |
| 5 | **Desmond Tutu legacy African Worry Doll** — made for his granddaughter Lungi Morrison; Tutu quote; thanks to tour guides who bring visitors to the Hub | Product story | Shop → African Worry Dolls |
| 6 | **How corporate workshops sustain Souper Troopers** — the Reconnection Workshop at **Voltalia**, facilitated by counsellor **Jake Gluckman**; each workshop funds skills development, meals, transport, interview clothing, eye tests and dentures | Service offering | Get Involved → businesses (plugs the team-building gap) |
| 7 | Voltalia workshop photography | Photos | Media library |
| 8 | **"Your Uniqueness"** — four-week workshop by volunteer **Amanda Blair**, "Mind Safari" approach, run through Human Rights month | Story | Get Involved → skills-sharing |
| 9 | Workshop photography | Photos | Media library |
| 10 | **From sunrise to boardroom breaks** — Troopers Coffee for Airbnb hosts and corporate offices; The Lab Blue, Franschhoek; Dignity Blend | Commercial offering | Get Involved → businesses + Shop (plugs the B2B coffee gap) |
| 11 | **From our hands to the world** — handmade Easter flowers for **Woolworths** stores, in partnership with **VM Central** | Programme proof | Get Involved → the Woolworths Project (currently named with no detail) |
| 12 | The Humanity Hub photography | Photos | Media library |
| 13 | The Humanity Hub photography | Photos | Media library |
| 14 | **Donations thank-you** — Yousuf Karodia, Wunders, Aaron, Kaap Diem | Time-bound | Issue archive only |
| 15 | Back page — "UNIQUE, our word for the month"; group photo; credits | Time-bound | Issue archive only |

## What this means for the plan

**Most of Souper News isn't news.** Only pages 14 and 15 are genuinely time-bound. Everything else
is evergreen material that plugs gaps already identified on the new site — corporate workshops,
office coffee, the Woolworths Project, volunteering, and a success story. Distributing it across
existing pages is both the design-coherent option (it reuses existing components, so nothing looks
bolted on) and removes the need for a news section at all for now.

Keep the magazine itself as an **issue archive** — cover, date, contents, and a readable viewer —
so the design work is respected and future issues have somewhere to land. The timeline treatment
becomes worth building once there are several issues to put on it.

## Open questions for Kerry

1. **Consent.** The magazine names beneficiaries and pairs them with photographs and personal
   history (Unam's recovery and employment). A magazine is bounded; an indexed web page is
   permanent and searchable against someone's name. Consent to appear in the March issue is not
   automatically consent to that. Needs confirming per person before anything is republished.
2. **Are there other issues?** Only March 2026 is on the site. Are there earlier ones, and is this
   monthly? The answer decides whether the timeline is worth building now or later.
3. **Original assets.** Six pages are professional photography by EF Ogle Productions, flattened
   into page layouts. The original photo files would go a long way toward the outstanding "more
   media needed" ask — worth requesting alongside the magazine's source file or a PDF.
