/**
 * Whether the shop takes payment online (the basket and PayFast checkout).
 *
 * Off at the October 2026 launch: the PayFast settings in Netlify were still the test account's
 * (merchant 10052763), and live mode with test details sends shoppers to PayFast's error page. With
 * this off, the basket icon leaves the header and "Add to cart" becomes "Order this", which opens the
 * contact form with the order already started.
 *
 * Switched on 13 October 2026, after a PayFast sandbox purchase on a deploy preview delivered the
 * order email (items, buyer name and email) to sales@. The live merchant ID, key and passphrase are
 * in Netlify's Production context with PAYFAST_MODE "live"; previews keep the sandbox ones. Set this
 * back to false to return to "Order this" through the contact form.
 */
export const SHOP_CHECKOUT = true;

/**
 * Checkout is also on in local development and on branch previews (October 2026), so the order
 * email can be tested end to end against PayFast's test mode without touching the live site.
 * Netlify sets CONTEXT at build time; it is "production" only for the live site.
 */
export const CHECKOUT_ENABLED = SHOP_CHECKOUT || process.env.CONTEXT !== "production";

/** The contact form, with an order for `item` started in the message (see contact.astro's topics). */
export function orderLink(item: string): string {
	return `/contact/?topic=order&item=${encodeURIComponent(item)}#send-message`;
}
