/**
 * Single source of truth for the parts of the Humanity Hub's address that Sanity doesn't hold.
 *
 * Sanity's `siteSettings.address` is one flat string ("66 Newmarket Street, Woodstock, Cape Town"),
 * which is the right shape for Kerry to edit and the wrong shape for a machine — a string can't be
 * resolved to a place, and it carries no postal code. Everything a `schema.org` `PostalAddress`
 * needs beyond the street lives here instead, as constants, because they aren't fields anyone can
 * edit in the Studio today.
 *
 * The same reasoning as `opening-hours.ts`: the visible address, the structured data Google reads,
 * and the Google Business Profile listing all have to agree, and the way to guarantee that is to
 * derive them rather than write the address down three times. A postal code stated in one place and
 * missing in another is exactly the kind of mismatch that weakens the cross-check the listing
 * depends on.
 *
 * ⚠ If the organisation ever moves city, every constant in this file needs changing alongside the
 * Sanity value.
 */

/**
 * Confirmed by Shan on 2026-08-15 for 66 Newmarket Street specifically, not just for Woodstock
 * generally — which was the open question, since codes can differ street by street.
 */
export const postalCode = "7925";

export const addressLocality = "Cape Town";
export const addressRegion = "Western Cape";
/** ISO 3166-1 alpha-2, which is what `schema.org` expects here rather than the country's name. */
export const addressCountry = "ZA";

/**
 * The Sanity value ends "..., Cape Town", which `addressLocality` already asserts, so it's stripped
 * to avoid stating the city twice in one address. If the string ever stops ending that way the match
 * simply fails and the full value is used, which is still valid.
 */
export function streetAddressFrom(sanityAddress: string): string {
	return sanityAddress.replace(/,\s*Cape Town\s*$/i, "");
}

/**
 * The address as a human reads it, with the postal code appended.
 *
 * Appended rather than stored in Sanity on purpose: putting the code into that field would defeat
 * the `Cape Town` strip above (the string would no longer end there), so the street address handed
 * to search engines would silently start including the city and the code. Keeping the code out of
 * the editable string means Kerry can rewrite the street line freely without knowing any of that.
 */
export function displayAddress(sanityAddress: string): string {
	return `${sanityAddress}, ${postalCode}`;
}
