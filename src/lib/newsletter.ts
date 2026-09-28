/**
 * The newsletter sign-up (28 September, `q47`): Shan agreed to a sign-up in the footer and near the
 * bottom of the homepage rather than a pop-up, headed "Get news and updates".
 *
 * `NEWSLETTER_FORM_URL` is Mailchimp's public signup form URL (Forms > Forms settings > the link icon
 * in the System forms table - checked against Mailchimp's help, 28 September 2026). Paste the long form, `https://<account>.us13.list-manage.com/subscribe?u=...&id=...` -
 * an eepurl.com short link only redirects to it, and the u and id in the long form are what the
 * form posts to. Until it is set, the sign-up shows in local development only, so nothing
 * unconnected reaches the live site.
 */
// From Shan, 28 September (eepurl.com/gMxb9j, followed to its long form). The form asks only for
// an email address; first and last name and the "Souper Mothers" group are optional there.
export const NEWSLETTER_FORM_URL: string | null =
	"https://soupertroopers.us13.list-manage.com/subscribe?u=3df721daebc5c76c899c3e3d4&id=da88c4e011";

export type NewsletterForm = { action: string; honeypot: string };

/** Mailchimp's embedded-form endpoint and its bot-trap field, derived from the public form URL. */
export function newsletterForm(url: string | null = NEWSLETTER_FORM_URL): NewsletterForm | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		const u = parsed.searchParams.get("u");
		const id = parsed.searchParams.get("id");
		if (!u || !id || !parsed.hostname.endsWith(".list-manage.com")) return null;
		const action = new URL("/subscribe/post", parsed.origin);
		action.searchParams.set("u", u);
		action.searchParams.set("id", id);
		// Mailchimp's embed code names its hidden bot-trap field b_<u>_<id>; a real person leaves it empty.
		return { action: action.href, honeypot: `b_${u}_${id}` };
	} catch {
		return null;
	}
}

/** Whether the sign-up renders: once connected, or in local development for review. */
export const newsletterVisible = (): boolean => newsletterForm() !== null || import.meta.env.DEV;
