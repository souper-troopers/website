# Shop product data: Sanity vs. WooCommerce

## The question
The new website needs real product data (prices, variants, stock, descriptions, photos) for Troopers Coffee and African Worry Dolls. The current live site already manages all of this in **WooCommerce** (`soupertroopers.org/soupermarket`). The new site's other content (success stories, team members, partners, impact stats) lives in **Sanity**, a separate CMS. We need to decide where *product* content should live going forward.

This only affects where product *content* is edited day-to-day. It's separate from the checkout question (how a customer actually pays) — that's still undecided and doesn't need answering to make this call.

## Option A — Full WooCommerce (one source of truth)
Product data (price, variants, stock, description, photos) is pulled directly from WooCommerce. Sanity isn't involved in products at all.

**Pros**
- No new workflow to learn — you already manage products in WooCommerce today, exactly as you do now.
- No risk of the two systems disagreeing — there's only one place a product's details can be, so what's live is always accurate.
- Less setup work to build.

**Cons**
- Editing products happens in a different place (WordPress) than editing everything else on the site (Sanity Studio) — two logins, two interfaces.

## Option B — Hybrid (Sanity for content, WooCommerce for price/stock)
Descriptions, photos, and badges live in Sanity (matching the rest of the site's content workflow); WooCommerce only supplies live price and stock numbers, matched up automatically by product name.

**Pros**
- One consistent place (Sanity Studio) for editing everything else on the site — team, stories, partners, and now product descriptions/photos too.

**Cons**
- Two systems now describe the same product — a photo or description update has to be made in Sanity, while price/stock changes happen in WooCommerce. Easy for the two to quietly fall out of sync (e.g. a product photo gets updated in one place and forgotten in the other).
- More setup work, and more moving parts to go wrong (matching a Sanity entry to the right WooCommerce product relies on the names lining up exactly).

## Recommendation
**Option A (full WooCommerce)**. The main argument for Sanity elsewhere on this site is that it's *filling a gap* — there was no existing system for team bios or success stories. That's not true for products: WooCommerce already has complete, actively-maintained product content today. Splitting it across two systems mainly adds a way for things to drift out of sync, without a clear offsetting benefit.

## What this doesn't decide
- **Checkout** — whether payment happens through WooCommerce's own checkout, an embed, a redirect to the old site, or something built fresh (Stripe/Snipcart, per the original stack plan) is a separate, still-open question.
- **Access** — either option needs someone to generate a WooCommerce REST API key from the WordPress admin (`WooCommerce → Settings → Advanced → REST API`), which needs Kerry (or whoever has admin access to `soupertroopers.org`'s WordPress).
