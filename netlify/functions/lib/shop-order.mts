// Shared by create-payfast-payment and payfast-itn. Lives in a subfolder so Netlify doesn't deploy
// it as a function of its own (a subfolder is only a function if it holds lib.mts or index.mts).

/** Netlify Blobs store holding each checkout, keyed by our m_payment_id. */
export const ORDER_STORE = "shop-orders";

export interface OrderLine {
	name: string;
	price: number;
	qty: number;
}

export interface StoredOrder {
	lines: OrderLine[];
	/** Rands, two decimals - the same string sent to PayFast as `amount`. */
	total: string;
	createdAt: string;
	/** Set once the order email has gone, so a repeated PayFast notification doesn't send it twice. */
	notifiedAt?: string;
}

/**
 * Plain ASCII for anything sent to PayFast: the signature is computed over these exact characters,
 * and dashes and ellipses are where an encoding mismatch would show up as a failed payment. The
 * attribute products' names carry an em dash ("Bracelets — Souper, adult").
 */
export function ascii(text: string): string {
	return text.replace(/[\u2013\u2014]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[^\x20-\x7E]/g, "");
}

/** "2 x Bracelets - Souper, adult (R80.00); 1 x ..." - cut to `max` characters if given. */
export function describeLines(lines: OrderLine[], max?: number): string {
	const text = ascii(
		lines.map((line) => `${line.qty} x ${line.name} (R${(line.price * line.qty).toFixed(2)})`).join("; ")
	);
	if (!max || text.length <= max) return text;
	return text.slice(0, max - 3) + "...";
}

/**
 * The address of the deploy this function is running on. On a branch preview Netlify's `URL` is
 * still the live site, so a preview's PayFast notifications and order emails would land on
 * production's functions; DEPLOY_PRIME_URL is the preview's own address.
 */
export function siteUrl(): string {
	if (process.env.CONTEXT && process.env.CONTEXT !== "production" && process.env.DEPLOY_PRIME_URL) {
		return process.env.DEPLOY_PRIME_URL;
	}
	return process.env.URL ?? "https://soupertroopers.org";
}
