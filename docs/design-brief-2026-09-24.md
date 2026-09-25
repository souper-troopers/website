# Design brief: one look for every page (draft, 24 September 2026)

**For:** the session doing the redesign pass. Read `AGENTS.md` first; every rule in it still holds.
This brief adds the *what* and *why* on top of it. Work on `dev`, never publish, and stop for
Stephen's review at the end of each phase below with screenshots at 390 and 1280.

## 1. Where the site is, measured on 24 September

Screenshots of every public page at 390 and 1280 (`localhost:8888`, `dev` at `670d452`) show a site
that was built page by page and now reads that way.

**Three hero systems.** The homepage has a full-bleed photo behind a transparent header, with a
parallax. Every other page opens on a flat ink slab (`.page-hero`): dark sticky header on a dark
block, a title and one sentence, then the off-white page starts. Who We Are is a third variant: no
slab, a tinted photo card sitting under the header. A visitor clicking Home → Our Work moves from
photo to black wall.

**Too much dark surface.** Adrian's "the site is too dark" (21 September) is right and it is
structural, not a colour choice. An inner page at 1280 stacks dark header + dark hero + dark footer,
and Our Work adds a dark CAST card and a dark impact band on top of that: more than half its height
is a dark surface. Who We Are adds a dark partners band.

**About ten card treatments.** White card with shadow (pillars, team, news); pale-teal tinted card
(Volunteer, Partner); solid teal card (1,700+); photo under a dark tint with white text (services,
"what your donation funds", "other ways to help"); photo under a light tint with ink text (Get
Involved banners, the trial); translucent glass card on a gradient (success stories); dashed box
(custom dolls); left-border callout (handmade note, "one thing we would ask"); plain hairline card
(volunteer ways); and two gradient bands (teal→red). The same content type gets a different box on
each page: success stories are glass cards on the homepage and white cards on Our Work.

**Section chips half removed.** `MOST DIRECT WAY TO HELP`, `SUCCESS STORIES`, `THE CAST JOURNEY`,
`IMPACT`, `WHAT WE CAN USE`, `COMMON QUESTIONS`, `IN PRACTICE`… were taken off Contact, Shop, Donate
and Who We Are on 13–14 September and still sit on Home, Our Work and the three Get Involved child
pages. Each one restates the heading under it.

**Five button looks.** Teal pill with ink label (header); white pill (hero Donate); ink outline (Add
to cart, "Other ways to help"); teal outline (Donate page); white "See how" pill with a chevron.

**Word counts** (`main` text, 1280): Who We Are 563, Corporate partnership 574, Our Work 393, Donate
goods 385, Volunteer 322, Donate 301, Homepage 273, Contact 135, Shop 115, Get Involved 57. Page
heights at 390: Who We Are 8,751px (about 22 screens), Donate 5,032, Our Work 5,383, Home 4,192.

**What repeats across pages.** The street address is in the opening paragraph of Volunteer and Donate
goods, on Contact, and in every footer. "From a first conversation to a first pay cheque" opens Home,
Who We Are's mission and Donate's hero. CAST is explained on Home (pillar), Who We Are ("How we
work", three cards) and Our Work. "Every purchase pays a wage" is on Home, Shop and Donate. The three
success stories appear in full on Home and again on Our Work. Who We Are, Donate goods and Corporate
partnership each end on a closing CTA row although Donate / Shop is in the header on every page.

## 2. What we want

1. **One look.** A visitor should not be able to tell which page was built first.
2. **Lighter.** Photo and off-white carry the pages; dark is an accent, not the ground.
3. **Less to read.** People read when they are deciding or checking trust, not before. Each page keeps
   what decides and puts the rest a click away, or on the one page that owns it.
4. **Cleaner.** Fewer box styles, fewer labels, fewer buttons, more air.

"Sexier" means the photos and the white space do the work, not more decoration.

## 3. The system to converge on

### 3.1 Hero: a photo behind the header on every top-level page

- The homepage pattern becomes the pattern: `.hero-photo`'s full-bleed image, the transparent
  `site-header-overlay`, the parallax at `parallaxRate = 0.3` (off under
  `prefers-reduced-motion`), the tint measured on real pixels.
- **Heights:** homepage stays at its natural height until the video lands (commit `670d452`, and the
  full-screen CSS is in `37ab492` for when it does). Top-level inner pages: roughly 52–60vh at 1280,
  `min-height` 360px; on a phone about 45svh. **Shortening these to ~40vh / 34svh was tried and
  reverted on 25 September**: with the photo anchored to its top, a shorter box shows a thinner
  slice and the pictures became too cropped. The height is the price of the photo; don't re-propose
  it without a different photo treatment. Child and product pages: a slim band, about 220px,
  same photo as the parent, cropped and tinted the same way.
- **Where the words sit (decided 25 September).** Top-level inner pages (`size="page"`): the
  content is **vertically centred in the photo below the header** - the header's clearance plus half
  a header height above, the same half below - not anchored to the foot, where it read low and
  tight. Then nudged 40px below that centre, with 28px under the `h1` (trialled on About, approved
  the same day). Child and product pages (`size="band"`): still anchored to the
  foot, with 56px under the words (was 32) and 14px under the `h1`; the band grows a little. The
  homepage keeps its own layout. Moving the words onto the photo's middle means checking faces
  again: Donate now uses `zoom={1.9}`, like Corporate partnership, so the line clears her face at
  1024-1440; the other heroes needed nothing.
- **Content in the hero:** the `h1`, one line of at most 20 words, and at most one control. Nothing
  else. Breadcrumbs stay on child pages, above the `h1`.
- **Tint:** the homepage's dark tint with white text, on every hero, measured per photo (body
  ≥4.5:1, `h1` ≥3:1). Hold the tint to the side the text sits on and fade it to nothing, so most of
  the photo stays at full colour. **One direction site-wide**; a light hero on one page and a dark
  one on the next is the inconsistency we are removing.
- **The pale wash is dropped (decided 25 September).** The Get Involved trial (`gi-tint-light`, ink
  text on an off-white wash) answered Adrian's "too dark" at the wrong layer. The dark he sees is
  the *ground*: ink hero slabs, dark mid-page bands, dark-tinted cards, over half of Our Work by
  height. Phases 1 and 2 remove that. The wash, by contrast, erases the photo where the eye lands
  (0.92 opacity under the text) and reads as faded rather than lit; a dark gradient needed only
  ~0.66 for the same legibility on the shop photo. So: **remove the `gi-tint-light` class in phase 1**
  (the banners return to the dark version with no other change), and where no text needs to sit on
  a photo, use the photo-top / text-below card, which needs no tint at all. Show Adrian phase 1 on
  the 30th and ask whether it still reads dark before anyone revisits this.
- **Photos.** Only four landscape photos on the site are banner-grade, and all are already
  published (so no new consent exposure, see `q19`):

  | Page | Photo | Notes |
  |---|---|---|
  | Home | `mandela-mural.png` 2560×1280 | unchanged |
  | Who We Are, Contact | `humanity-hub-exterior.jpg` 2400×1600 | crops from the right only, keep the 66 |
  | Our Work, Get Involved, Volunteer, Donate goods | `support-conversation.jpg` 5472×3648 | two people, faces visible, already on the homepage |
  | Shop and its category/product pages | `shop-products.jpg` 5472×3648 | the current shop promise card becomes the hero |
  | Donate, Corporate partnership | `partner-visit.jpg` 1600×1067 | lowest resolution; check it at 1280 before committing |

  `dignity-moment.jpg`, `workshop-craft.jpg` and `support-one-to-one.jpg` are portrait or near-square
  and do not work as banners. Do not pull new photos from `../souper-troopers-media/` for heroes:
  participants' faces need the consent answer (`q19`). Brad's drone footage of the building
  (21 September minutes) would give a still for Who We Are or Contact later; note it, do not wait
  for it.
- **Performance rules that already apply:** the hero image is the LCP element, so
  `loading="eager"` + `fetchpriority="high"` on it and nothing else; the `[loading="eager"]`
  opacity rule keeps it from fading in. Re-measure LCP on `/`, `/about/`, `/shop/` after.
- `.page-hero` should have no users left on public pages when this is done. The internal pages
  (`/internal`, `/changelog`, `/request-for-comment`, `/google-listing`, `/shmiley-decision`,
  `/video-brief`) may keep it.

### 3.2 Surfaces: three, and one dark band per page at most

- Page ground `--st-bg`, white card, and **at most one** dark band per page besides the footer.
  Our Work currently has three (CAST card, impact band, plus the hero); pick one.
- **The diagonal teal→red gradient** (`.stories-band`) appears twice: behind "People, not just
  statistics" on the homepage, with the stories in translucent glass cards, and behind "How we
  began" on Who We Are. `AGENTS.md` already records its white body copy at 2.76:1 at the teal end,
  under AA for the whole band. Retire it: the stories move to the white card shape below on the
  page ground, and "How we began" becomes a plain section. Do not reintroduce it elsewhere.
- The pale-teal tinted cards and the solid-teal 1,700+ card on the homepage collapse into the white
  card with a teal top rule (the Donate page's EFT card already does this).

### 3.3 Components: one of each

- **Card:** white, `--radius`, the existing soft shadow, no border. Photo cards are photo on top,
  text on white beneath (the homepage pillars), never text on the photo. The service cards on Our
  Work and the donation-funds tiles on Donate move to this shape; that also removes the per-photo
  contrast measuring those tinted cards need.
- **Callout:** one style (the left-border note). The dashed box under the Worry Dolls becomes it.
- **FAQ:** `Faq.astro`, always `collapsible`, unchanged.
- **Buttons:** three. `.btn-primary` (teal fill, ink label) for the one primary action on a page,
  `.btn-outline` for a secondary beside it, `.btn-outline-teal` for a group of equal actions. The
  white hero pill becomes `.btn-primary`; "See how" becomes `.btn-outline` on a light tint.
- **Section chips go, everywhere.** The heading says it.
- **The nav's "Shop" link goes (decided 25 September).** "Shop" is in the header three times: the nav
  link, the right half of the Donate / Shop pill, and the cart icon. The pill is the one the
  2 September review asked for, and on phones the nav link is behind the hamburger anyway, so
  nothing visible is lost there. The nav becomes Home, Who We Are, Our Work, Get Involved, Contact.
  Give the pill's Shop half an `aria-current="page"` treatment on `/shop` routes, since the nav
  underline was the only current-page marker. Leave the cart icon exactly as it is: it is state, not
  navigation, and hiding it when empty would move the header. Re-measure the header at 761–1085px
  afterwards; this is the first width the row has gained, and it should narrow the wrap band.
- **Closing CTA rows go** on pages where Donate / Shop is in the header, which is all of them. A page
  ends on its last section and the footer.
- Success stories: one shape (Our Work's white card with the teal-rule quote), used on both pages.
  The homepage shows one story with a link to the rest, not three.

### 3.4 Typography and spacing

- One `h1` size across heroes (the homepage `h1` can stay larger); one `h2` scale
  (`clamp(1.6rem, 3vw, 2.2rem)` range); `h3` as on Get Involved's sub-sections.
- Section intros ≤30 words; card text ≤25 words, with a `.card-more` for anything beyond.
- Section spacing: one `--space` value between sections, the same on every page. Today the gap
  visibly varies between Donate and Our Work.

### 3.5 Copy: one fact, one page

Assign each repeated fact a home and link to it from elsewhere:

| Fact | Lives on | Elsewhere |
|---|---|---|
| Street address, hours, by-appointment | Contact (and the footer) | a link, not the address |
| What CAST is, the four steps | Our Work | one line + link (Home pillar, Who We Are) |
| Success stories in full | Our Work | Home shows one |
| "Every purchase pays a wage" | Shop hero | Home pillar keeps its one line; Donate's tile links |
| Section 18A and PBO | Donate FAQ (and footer line) | one mention per giving page, not four |
| Woolworths / B-BBEE Level 1 | Corporate partnership | Who We Are's lead-partner card stays |

Get Involved (57 words) and its children (322–574) are out of balance the other way: the parent
should carry one line per route so a visitor who knows what they want can go straight there; the
children lose their opening restatement of the parent.

**What must not be cut** (from `AGENTS.md`): FAQ answers restating facts (each has to survive
extraction alone); "at the Humanity Hub in Woodstock, Cape Town" once in each page's opening
paragraph; the B-BBEE disclaimer wherever figures appear; "Souper Troopers is not a shelter" on
Contact; the handmade-doll note on the Worry Dolls pages.

## 4. Page by page

- **Home:** hero unchanged. Pillars unchanged. "How to get involved" becomes three white cards with
  a teal rule (no solid teal, no pale-teal). Stories: one story in the white card shape on the page
  ground, with a link to Our Work; the gradient band goes. Target: under 3,500px at 390.
- **Who We Are:** the photo card becomes the hero. Mission stays as the centred statement. "How we
  began" loses the gradient. "How we work" drops the three CAST cards for one line and the link. Team
  and partners unchanged. News unchanged. Closing CTA row goes. Target: under 6,000px at 390.
- **Our Work:** photo hero. Choose one dark band: the CAST stage (it is the page's subject) and make
  the impact band light. Services grid moves to photo-top cards. Stories as now. Chips go.
- **Get Involved:** photo hero; the two audience banners stay (they are the page) and **stay closed
  on load** (decided 24 September: we do not know who is visiting, so neither audience opens
  first). Their tint matches the hero's direction. One line per route inside each banner's summary
  so closed banners still route people.
- **Volunteer, Donate goods, Corporate partnership:** slim photo band, chips go, opening paragraph
  cut to what the parent did not say, closing CTA rows go.
- **Donate:** photo hero. "What your donation funds" tiles become photo-top cards. Stats band becomes
  a light band (it is trust evidence at the point of giving, keep the numbers). Ways to give unchanged
  in structure, buttons unchanged. Chips already gone.
- **Contact:** photo hero (hub exterior), which lets the Visit us card lose its photo and sit level
  with Email us. Otherwise unchanged; it was reworked on 13 September.
- **Shop:** the promise card becomes the hero. Tiles unchanged (24 September). Category and product
  pages: slim band, the dashed box becomes the callout.

## 5. Guardrails

- **Contrast is measured on real pixels**, under every line of text, at 360–1440 (the `tint2.mjs`
  pattern). A hero over a new photo is a new measurement. Headings ≥3:1, body ≥4.5:1.
- **No text on a photo** unless measured as above. Photo-top cards need nothing.
- **Colour is an affordance:** teal on text or a pill means clickable. Static text is ink.
- **The header row has no slack at 1100px**; nothing is added to it. `--header-height` derives the
  hero padding; the 761–1085px wrap band is a known open issue, do not make it worse.
- **`@view-transition` is on.** Anything that changes between pages at the same position now visibly
  moves; a consistent hero height across pages makes the cross-fade calmer, which is part of why
  this brief exists.
- **Client-visible copy changes are shown word for word** before they land; questions go to
  `/request-for-comment`, not into guesses. Cutting repetition is ours to do; rewriting Kerry's
  phrases is not.
- **No identifiable person is added** to the site without `q19` settled. Only the photos in the
  table above.
- Sanity structure and schema are untouched by this work.
- **Update `AGENTS.md` and `/changelog` as part of shipping**, not after.
- Screenshot every page at 390 and 1280 before and after each phase, and check: no sideways
  scroll, header height unchanged at 390 and 1280, LCP not worse on `/`, `/about/`, `/shop/`.

## 6. Out of scope

The hero video (Brad), the CAST infographic (Brad's designer; the current prototype stays - on a
white stage since 25 September; **tell the designer the yellow A is low-contrast on white**, about
1.9:1 against a 3:1 floor for graphics, accepted because it is decorative: the word is carried by
its tail and by visually-hidden text), the
Humanity Hub naming (Kerry's board, 28 September), the shop's per-variation carousels and copy, the
donate rails, fonts (off, Kerry: "I'm not attached to it"), and anything under `/internal`.

## 7. Sequence

1. **Hero system** (`Layout.astro` + every top-level page). Stop and show. This is the change with the
   most visible effect and the most risk (header overlay, LCP, tint direction), so it is reviewed on
   its own.
2. **Surfaces and components**: chips, buttons, cards, gradient, closing CTAs, one dark band per
   page. Stop and show.
3. **Copy pass** under the one-fact-one-page table and the word budgets, with a before/after word
   count per page in the report.
There is no light-tint phase: see the tint bullet in 3.1 (decided 25 September).

Each stop: screenshots at 390 and 1280 for all twelve public pages, the word counts, and the
contrast measurement for every hero.

## 8. Timing

The next review call with Kerry, Adrian, Brad and Hilton is **Wednesday 30 September at 16:00**.
**Phase 1 (the hero system) is to be on `dev` and showable at that call, earlier if possible**
(decided 24 September). Phases 2 and 3 follow on their own clock after it. Publishing to `main` is
Stephen's call, not part of the phase.
