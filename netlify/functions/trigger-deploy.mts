/**
 * Publishes the site: POSTs the Netlify build hook, which starts a production deploy.
 *
 * Exists so Kerry and Shan can decide *when* the site updates, from a button inside the Sanity
 * Studio, without needing Netlify accounts at all. Netlify team members are a Pro-plan feature
 * ($20/mo); a build hook needs no authentication, so this route costs nothing.
 *
 * ── Why the hook URL is not simply put in the Studio ──────────────────────────────────────────
 * A build hook URL is a bearer credential in URL form — Netlify's own guidance is that it
 * "contains a unique, non-guessable path but no other form of authentication". Anyone holding it
 * can spend 15 credits per POST, and the site's whole monthly allowance is 20 production deploys.
 *
 * Today that URL is genuinely secret: it exists only in Sanity's webhook config and the Netlify
 * dashboard, both behind logins, and has never been committed to this (public) repo. Embedding it
 * in the Studio would publish it, because the Studio's JavaScript bundle is served openly even
 * though the content behind it requires a login. So it stays here, read from an environment
 * variable at runtime, and the Studio only ever learns this endpoint's address.
 *
 * ── What this actually protects, and what it doesn't ─────────────────────────────────────────
 * Honest accounting, because the origin check below looks stronger than it is:
 *
 *   - The `Origin` header is set by browsers and cannot be forged by a page on another site, so
 *     this does stop a malicious webpage triggering deploys through a visitor. It does NOT stop
 *     anyone using curl, where the header is whatever they type.
 *   - The cooldown is per-instance and Lambdas scale out, so it is a brake, not a lock. It exists
 *     to bound the damage of a stuck retry loop or an impatient double-click, not to defeat an
 *     attacker.
 *
 * The real containment is that the credential never leaves the server: if this endpoint is ever
 * found and abused, deleting or renaming this file stops it immediately, with no change to the
 * build hook and nothing to reconfigure in Sanity. That is a far better position than having
 * published the hook itself, which would mean rotating it in Netlify and updating Sanity's webhook.
 *
 * If it ever needs to be genuinely locked down, the next step is a shared passphrase held in the
 * Studio's local storage and checked here — deliberately not done yet, because it is one more
 * thing for Kerry to lose in exchange for very little given the above.
 *
 * Needs `NETLIFY_BUILD_HOOK_URL` set in Netlify (Site configuration → Environment variables), and
 * in `.env` for local `netlify dev`. Deliberately fails loudly rather than silently doing nothing.
 */

const ALLOWED_ORIGINS = new Set([
	"https://souper-troopers.sanity.studio",
	// Local `sanity dev`. Harmless in production: an attacker who can set Origin can set it to the
	// real Studio just as easily, so removing this would buy nothing.
	"http://localhost:3333",
]);

/** Long enough to absorb a double-click or a retry; short enough not to obstruct real work. */
const COOLDOWN_MS = 120_000;

let lastTriggeredAt = 0;

function corsHeaders(origin: string | null) {
	return {
		// Echo only a known origin — never `*`, which would let any page call this.
		"Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "null",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		Vary: "Origin",
	};
}

export default async (request: Request) => {
	const origin = request.headers.get("origin");
	const cors = corsHeaders(origin);
	const json = { ...cors, "Content-Type": "application/json" };

	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: cors });
	}

	if (request.method !== "POST") {
		return new Response(JSON.stringify({ error: "Use POST." }), { status: 405, headers: json });
	}

	if (!origin || !ALLOWED_ORIGINS.has(origin)) {
		return new Response(JSON.stringify({ error: "Not allowed from this origin." }), {
			status: 403,
			headers: json,
		});
	}

	const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
	if (!hookUrl) {
		return new Response(
			JSON.stringify({
				error:
					"Publishing isn't configured yet - NETLIFY_BUILD_HOOK_URL is missing. Ask whoever set up the site.",
			}),
			{ status: 500, headers: json }
		);
	}

	const now = Date.now();
	const waited = now - lastTriggeredAt;
	if (waited < COOLDOWN_MS) {
		const seconds = Math.ceil((COOLDOWN_MS - waited) / 1000);
		return new Response(
			JSON.stringify({
				error: `A publish just started. Give it ${seconds} more seconds before starting another.`,
			}),
			{ status: 429, headers: json }
		);
	}

	let response: Response;
	try {
		response = await fetch(hookUrl, { method: "POST" });
	} catch {
		return new Response(JSON.stringify({ error: "Couldn't reach Netlify. Please try again." }), {
			status: 502,
			headers: json,
		});
	}

	if (!response.ok) {
		// Most likely cause once live: the team is out of credits, so production deploys are paused.
		return new Response(
			JSON.stringify({
				error: `Netlify refused the publish (${response.status}). This usually means the site's monthly deploy allowance is used up.`,
			}),
			{ status: 502, headers: json }
		);
	}

	// Only on success, so a failed attempt doesn't lock out an immediate retry.
	lastTriggeredAt = now;

	return new Response(JSON.stringify({ ok: true }), { status: 200, headers: json });
};
