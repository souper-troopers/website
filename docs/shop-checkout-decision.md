# Shop checkout: build real payment now, or keep it manual for now?

**See it, don't just read about it**: a visual mockup comparing both experiences side by side (real products/prices, toggle between "Current" and "Proposed") was built 2026-08-09 — ask Stephen for the link (private by default, needs sharing).

## Where things stand today
The Shop page currently has no real checkout — a visitor picks a product and submits a request form; Kerry/Shan follow up by email to confirm pricing and arrange payment (EFT/SnapScan) and collection. That's staying true regardless of what's decided here — **collection is always in person (66 Newmarket Street) or a courier the buyer arranges themselves**, so there's no shipping/delivery automation question either way.

The one thing definitely changing regardless: product prices and variants are moving into the site's own CMS (Sanity) with real, accurate data, replacing the current placeholder/no-pricing state. That happens either way.

The open question is whether to go further and add **real, automatic online payment** at checkout.

## Option A — Add real checkout (Paystack)
A shopper picks products, pays online by card or EFT at the moment of ordering, instead of waiting for an email reply to arrange payment.

- **Processor**: Paystack (Stripe's African arm — Stripe itself doesn't support South African merchant accounts directly). Supports card **and EFT** as first-class payment methods.
- **Fees**: 2% flat on EFT, 2.9% + R1.50 on card. No monthly fee, no setup fee — only pay when something actually sells.
- **Setup**: needs a Paystack account verified with FICA documents (standard South African business/KYC verification), 1–2 business days to activate — likely needs Souper Troopers' own registration paperwork, so this step needs Kerry either way.
- **Order notifications**: automatic — Paystack emails the merchant a receipt on every successful payment (a dashboard setting, not something we need to build), and emails the customer a receipt too.
- **What we'd build**: a shopping cart on the site, plus one small piece of backend automation to hand off to Paystack's payment page and confirm the payment went through. A real but bounded amount of new work — not simple, not huge either.
- **What doesn't change**: fulfillment is still a manual, in-person step regardless — someone still needs to prepare the order for pickup/courier. Real checkout speeds up *getting paid*, not *getting the product to the buyer*.

## Option B — Keep it manual, just with real prices
Same request-and-confirm flow as today, but the prices and options shown are finally accurate (pulled from real data instead of being unconfirmed).

- **What we'd build**: nothing beyond the pricing/data work already planned.
- **Tradeoff**: a buyer has to wait for a reply email before paying, rather than paying instantly at checkout.

## The real question, and why it's Kerry's call
This isn't really a technical decision — Paystack is a solid, appropriately-priced fit for South Africa if real checkout is wanted. The actual question is **how many shop orders realistically come through**, and whether that volume justifies:
- an online payment account that needs to stay verified/maintained,
- and instant checkout being worth more to buyers than a quick email exchange.

For a low-volume, handmade-goods, local-pickup shop, Option B might serve just as well for a lot less ongoing complexity. For a shop that's actually turning away/losing sales because people don't want to wait for an email reply, Option A pays for itself quickly. Kerry and Shan are the ones who'd know which of those is closer to true.
