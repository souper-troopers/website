/**
 * Whether the shop takes payment online (the basket and PayFast checkout).
 *
 * Off at the October 2026 launch: the PayFast settings in Netlify were still the test account's
 * (merchant 10052763), and live mode with test details sends shoppers to PayFast's error page. With
 * this off, the basket icon leaves the header and "Add to cart" becomes "Order this", which opens the
 * contact form with the order already started.
 *
 * To turn checkout on: put the live merchant ID, key and passphrase into Netlify's environment
 * variables, set PAYFAST_MODE to "live", set this to true, publish, and make one small real purchase
 * to confirm the money arrives.
 */
export const SHOP_CHECKOUT = true;

/** The contact form, with an order for `item` started in the message (see contact.astro's topics). */
export function orderLink(item: string): string {
	return `/contact/?topic=order&item=${encodeURIComponent(item)}#send-message`;
}
