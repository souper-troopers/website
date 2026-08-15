import type { Config, Context } from "@netlify/edge-functions";

/**
 * HTTP Basic auth over the internal pages and the comments API.
 *
 * ── Why this is now needed, when it wasn't before ────────────────────────────────────────────
 * These pages were protected by nothing but obscurity: `noindex`, out of the sitemap, and reachable
 * only from a link pasted into an email. Two changes on 2026-08-15 dismantled that. A **"Status"
 * link now sits in the site header on every page**, so the update page is one click from anyone who
 * opens the preview at all; and the page grew **open text boxes** that write to a store. Obscurity
 * was a thin argument even before; with a linked page and a public write endpoint it isn't one.
 *
 * ── Why Basic auth rather than the alternatives ─────────────────────────────────────────────
 * Netlify's own password protection is a **Pro-plan feature** ($20/mo) — the same wall that the
 * Studio Publish button was built to avoid, and not worth paying for one page. An edge function
 * costs nothing on any plan and runs before the static file is served, so the HTML itself never
 * reaches an unauthenticated visitor. A passphrase checked in JavaScript would not manage that: the
 * page and everything in it would already have been delivered.
 *
 * ── What it does and doesn't buy ────────────────────────────────────────────────────────────
 *   - It stops drive-by discovery and casual spam completely: no password, no page, no API.
 *   - It is a **single shared password** for five people, so it identifies nobody. The name on a
 *     comment is still self-declared and still trust-based — this closes the door to strangers, it
 *     does not distinguish Kerry from Shan.
 *   - Credentials travel over HTTPS, and browsers cache them for the origin, so the fetches the
 *     page makes to `/api/comments` carry them automatically.
 *
 * Needs `STATUS_PASSWORD` set in Netlify → Site configuration → Environment variables, and in
 * `.env` for local `netlify dev`. **If it is unset the function fails closed** — locking everyone
 * out is recoverable in a minute, whereas failing open would silently publish the thing this
 * exists to protect.
 */

const USERNAME = "souper";
const REALM = "Souper Troopers - project status";

/**
 * Length-independent comparison. The timing signal here is negligible over a network, but a
 * password check that leaks its progress is the kind of thing that is embarrassing to explain and
 * costs one function to avoid.
 */
function safeEqual(a: string, b: string): boolean {
	const encoder = new TextEncoder();
	const left = encoder.encode(a);
	const right = encoder.encode(b);
	// Compare a fixed number of bytes either way, so length alone doesn't short-circuit.
	let mismatch = left.length ^ right.length;
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		mismatch |= (left[i] ?? 0) ^ (right[i] ?? 0);
	}
	return mismatch === 0;
}

function challenge(message: string) {
	return new Response(message, {
		status: 401,
		headers: {
			"WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
			"Content-Type": "text/plain; charset=utf-8",
			// Never let a challenge or a protected page sit in a shared cache.
			"Cache-Control": "no-store",
		},
	});
}

export default async (request: Request, context: Context) => {
	const expected = Netlify.env.get("STATUS_PASSWORD");
	if (!expected) {
		// Fails closed. See the note above: a missing secret must not mean "let everyone in".
		return challenge("This area is not configured. STATUS_PASSWORD is not set.");
	}

	const header = request.headers.get("authorization") || "";
	if (!header.toLowerCase().startsWith("basic ")) {
		return challenge("Password required.");
	}

	let decoded = "";
	try {
		decoded = atob(header.slice(6).trim());
	} catch {
		return challenge("Password required.");
	}

	// Only the first colon separates the pair — a password may legitimately contain more.
	const separator = decoded.indexOf(":");
	const user = separator === -1 ? "" : decoded.slice(0, separator);
	const password = separator === -1 ? "" : decoded.slice(separator + 1);

	if (!safeEqual(user, USERNAME) || !safeEqual(password, expected)) {
		return challenge("Sorry, that didn't work.");
	}

	return context.next();
};

/**
 * A regex rather than a path list, because Astro emits directory-style routes: the page is served
 * at `/request-for-comment/` **with** a trailing slash, and a literal path match on the slashless
 * form would leave the real URL unprotected — the redirect between them is not a place to find out.
 * `/?$` covers both. The API is matched the same way; its query string is not part of the path.
 */
export const config: Config = {
	pattern: "^/(request-for-comment|google-listing|shmiley-decision|api/comments)/?$",
};
