/**
 * The "Save our Hub" campaign (drafted 30 September 2026, from that day's review): a fundraising page
 * to secure the building the Humanity Hub is in, and a band on the homepage leading to it.
 *
 * Everything the client still has to confirm lives here, so switching the campaign on, setting the
 * target or adding a match is one edit rather than a hunt through the page:
 * - `live`: false keeps the homepage band off live builds (it still shows under `astro dev`) and the
 *   page `noindex` and out of the sitemap. The page itself is always built, so it can be reviewed at
 *   its URL before launch.
 * - `target` / `raised` / `raisedOn`: the progress bar shows only when a target is set. The total is
 *   updated by hand - EFT, SnapScan and Yoco payments can't be read automatically.
 * - `match`: one sentence, shown only once a match is in writing (Kerry, 30 September).
 *
 * ⚠ Keep details of the building sale out of this public repo; Kerry called them sensitive.
 */
export const CAMPAIGN: {
	live: boolean;
	target: number | null;
	raised: number | null;
	raisedOn: string | null;
	match: string | null;
} = {
	live: false,
	target: null,
	raised: null,
	raisedOn: null,
	match: null,
};

/** Shown on the page, in the bank reference and on the PayFast item, so every route tags the same. */
export const CAMPAIGN_REFERENCE = "HUB";

export const campaignVisible = (): boolean => CAMPAIGN.live || import.meta.env.DEV;

export const rand = (n: number) => "R" + n.toLocaleString("en-ZA");
