import { IS_STAGING } from "./env";

/**
 * "Double Up for Humanity" (10 November 2026 review): Souper Troopers' BackaBuddy campaign, every
 * rand matched, target R1 million. Packs go to their own supporters from Monday 16 November; the
 * public campaign runs 23-27 November.
 *
 * The page is /double-up/ - no menu item; reached from the red band (HubAppeal.astro) or the address
 * (also /doubleup and /doubleupforhumanity, in public/_redirects). Built so the same slot can carry
 * later campaigns.
 *
 * Switches, one edit each:
 * - `pageLive`: false keeps /double-up/ `noindex` (and out of the sitemap - astro.config.mjs). The
 *   page is always built, so it can be shared by link before it's announced.
 * - `bannerLive`: shows the red band on the live site. On staging and locally it always shows.
 * - `backabuddyUrl`: the campaign's page on BackaBuddy. Until it's set the button says the link is
 *   coming rather than pointing at the wrong campaign.
 * - `target` / `raised` / `raisedOn`: the bar shows once `raised` is set; updated by hand.
 *
 * ⚠ Every visible line on the page is placeholder wording from the 10 November meeting until Kerry
 * or Shan supply their own. Keep building-sale details out of this public repo.
 */
export const DOUBLE_UP: {
	pageLive: boolean;
	bannerLive: boolean;
	backabuddyUrl: string | null;
	target: number;
	raised: number | null;
	raisedOn: string | null;
} = {
	pageLive: false,
	bannerLive: false,
	backabuddyUrl: null,
	target: 1_000_000,
	raised: null,
	raisedOn: null,
};

/** The band is built on the live site only once switched on; always on staging and locally. */
export const doubleUpBannerBuilt = (): boolean => DOUBLE_UP.bannerLive || IS_STAGING || import.meta.env.DEV;

export const rand = (n: number) => "R" + n.toLocaleString("en-ZA");

/** "R1 million" rather than "R1 000 000" for round millions, as people say it. */
export const randWords = (n: number) => (n % 1_000_000 === 0 ? `R${n / 1_000_000} million` : rand(n));
