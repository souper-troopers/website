# Shop checkout: build real payment now, or keep it manual for now?

**See it, don't just read about it**: a visual mockup comparing both experiences side by side (real products/prices, toggle between "Current" and "Proposed") was built 2026-08-09 — ask Stephen for the link (private by default, needs sharing).

## Where things stand today
The Shop page currently has no real checkout — a visitor picks a product and submits a request form; Kerry/Shan follow up by email to confirm pricing and arrange payment (EFT/SnapScan) and collection. That's staying true regardless of what's decided here — **collection is always in person (66 Newmarket Street) or a courier the buyer arranges themselves**, so there's no shipping/delivery automation question either way.

The one thing definitely changing regardless: product prices and variants are moving into the site's own CMS (Sanity) with real, accurate data, replacing the current placeholder/no-pricing state. That happens either way.

The open question is whether to go further and add **real, automatic online payment** at checkout.

## Option A — Add real checkout (PayFast, direct integration)
A shopper picks products, pays online by card or EFT at the moment of ordering, instead of waiting for an email reply to arrange payment.

**Processor corrected 2026-08-09**: not Paystack. The user found the *current* live site (soupertroopers.org) already has a working WooCommerce cart and checkout via **PayFast** — a real, proven, already-verified merchant account, not something to set up from scratch. PayFast also isn't tied to WooCommerce/WordPress — they offer a general "Custom Integration" API (Merchant ID + Merchant Key, a signed redirect to their hosted payment page, an ITN webhook on completion) usable from any tech stack. So the plan is a **direct PayFast integration**: our own cart and checkout UI on the new site, reusing the *same already-verified merchant account* (Kerry retrieves the Merchant ID/Key from the existing PayFast dashboard — a credential lookup, not a new signup), with no WordPress dependency going forward.

- **Fees** (already being paid today, not new): 2% flat on EFT, 3.2% + R2 on card, plus a ~R8.70 payout fee and a R250 dispute fee if either comes up.
- **Setup**: none, in principle — reuses the existing verified account. Not yet confirmed whether the same Merchant ID can genuinely serve two simultaneous integrations (old WooCommerce site + new direct one) without conflict — worth confirming with PayFast before relying on it.
- **What we'd build**: a shopping cart (client-side state), a Netlify Function to build the signed payment request server-side, and a Netlify Function to handle PayFast's ITN webhook confirming payment. See "Build plan" below.
- **What doesn't change**: fulfillment is still a manual, in-person step regardless — someone still needs to prepare the order for pickup/courier. Real checkout speeds up *getting paid*, not *getting the product to the buyer*.
- **Unresolved, worth asking Kerry alongside everything else below**: she mentioned buying a domain for "Shmiley" (the entity that actually runs this shop) — purpose unknown, but there's a real chance the shop is meant to live on its own domain rather than as a section of this site. Doesn't block building (the code is portable), but should be resolved before this goes live anywhere.

## Build status: shipped and verified end-to-end (2026-08-09)
1. **Sanity**: `product` type replaced by two new types — `productCategory` (Coffee/Worry Dolls/Gift Tags, either a single "attributes" product with a variant dropdown, or an "items" grid) and `shopItem` (one doll style, one gift tag design). Seeded with **real data migrated once from the live WooCommerce site** — its embedded `data-product_variations` JSON gave exact prices, variant names, and photo URLs; photos were downloaded and re-uploaded as Sanity assets. 3 categories, 11 items, all real.
2. **Cart**: `src/lib/cart.svelte.ts`, a Svelte 5 runes store (`$state`), persisted to `localStorage`, plus `CartWidget.svelte` (header icon + slide-out drawer with running total).
3. **`create-payfast-payment` Netlify Function**: takes cart line *references* (not client-supplied prices), re-looks up real prices from Sanity **server-side**, builds PayFast's signed fields, returns the redirect target.
4. **`payfast-itn` Netlify Function**: verifies PayFast's webhook is genuine before treating any payment as confirmed.
5. **Two real bugs found and fixed via actual sandbox transactions** (not caught by code review — both needed a real completed purchase to surface):
   - `phpUrlEncode` didn't match PHP's `urlencode()` for `!'()*~` — any item name containing a parenthesis (e.g. "Gift Tag — Hans Moolman (pack of 3)") produced a signature PayFast would reject.
   - The bigger one: the ITN signature must be computed over PayFast's **raw POST body exactly as received** — including empty fields like `custom_str1=`, `name_first=`, which PayFast always sends. Re-parsing the body into a fields object and reconstructing a query string from it (the natural-looking approach, and correct for the *outgoing* request where we choose what to send) silently dropped every empty field and broke verification on every single real transaction, independent of the first fix.
6. **Confirmed working** with a real completed sandbox purchase, 2026-08-09 ~16:47 — "Gift Tag — India Harris (pack of 5)", R85.00 — `payfast-itn` logged `"PayFast payment confirmed"`.
7. Testing all of this locally needed `netlify dev` (plain `astro dev` has no idea Netlify Functions exist) — see the "Testing Netlify Functions locally" note under Development in `AGENTS.md` for the gotchas that cost real time working out.

## Option B — Keep it manual, just with real prices
Same request-and-confirm flow as today, but the prices and options shown are finally accurate (pulled from real data instead of being unconfirmed).

- **What we'd build**: nothing beyond the pricing/data work already planned.
- **Tradeoff**: a buyer has to wait for a reply email before paying, rather than paying instantly at checkout.

## The real question, and why it's Kerry's call
This isn't really a technical decision anymore — PayFast is already proven and already in use, so Option A doesn't carry the "new account to set up and maintain" cost it originally seemed to. The actual remaining question is **how many shop orders realistically come through**, and whether instant checkout is worth more to buyers than a quick email exchange — plus the Shmiley domain question above, which could affect *where* any of this ends up living.

For a low-volume, handmade-goods, local-pickup shop, Option B might still serve just as well for less ongoing complexity to maintain on our side (webhook handling, order state, etc.). For a shop that's actually turning away/losing sales because people don't want to wait for an email reply, Option A pays for itself quickly. Kerry and Shan are the ones who'd know which of those is closer to true.
