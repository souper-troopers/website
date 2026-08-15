import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/**
 * Comment threads on the internal update page (`/request-for-comment`), so Kerry, Shan and the
 * project side can answer questions in place instead of copying them into an email.
 *
 * ── Why the browser never talks to the store directly ────────────────────────────────────────
 * The obvious shortcut is Sanity: it is already here, already read tokenless from the browser, and
 * comments would even land in the weekly backup. That is exactly why it is wrong. The site reads
 * Sanity *without a token* — that is what makes a static build possible — so anything in the
 * `production` dataset is world-readable to anyone who finds the project id, which is sitting in
 * plain sight in the page's JavaScript bundle. These threads will discuss consent forms, people's
 * stories and money. Publishing them by accident is not a risk worth taking for saved effort.
 *
 * So the store is **Netlify Blobs**, which is reachable only from inside a function. There is no
 * credential in the browser because there is no credential at all — Blobs is scoped to the deploy.
 * Reads go through this endpoint too, not just writes, which is the whole point: a public read path
 * would recreate the problem it was chosen to avoid.
 *
 * ── What this does and doesn't protect ───────────────────────────────────────────────────────
 * Honest accounting, in the same spirit as `trigger-deploy.mts`:
 *
 *   - `Origin` is browser-set and unforgeable by another *page*, so this stops a third-party site
 *     reading or writing threads through a visitor's browser. It does nothing against curl.
 *   - There is **no authentication**. Anyone who has the URL can post as any of the named people.
 *     The page is `noindex`, excluded from the sitemap and unlinked from anywhere public, so this
 *     rests on the address not being guessed — the same footing as the Studio's Publish button.
 *     It is a working document between five known people, not a system of record; if it ever needs
 *     to be more than that, a shared passphrase checked here is the next step.
 *   - Comments cannot be edited or deleted from the page, deliberately. Deleting one is a
 *     `netlify blobs:delete` away for us, and an undo control would be one more thing to get wrong
 *     for a thread five people can simply reply to.
 */

/** One blob per item id (`q7`, `guide-google-listing`, `choice-3`), holding that thread as JSON. */
const STORE = "rfc-comments";

const ALLOWED_ORIGINS = new Set([
	"https://souper-troopers.netlify.app",
	"http://localhost:8888",
	"http://localhost:4321",
	"http://localhost:4399",
]);

/** Bounds a single thread so a stuck client can't grow one blob without limit. */
const MAX_PER_ITEM = 200;
const MAX_BODY_CHARS = 4000;
const MAX_NAME_CHARS = 40;
/** Mirrors `clientPeople` + `projectPeople` in `src/lib/people.ts` — keep the two in step. */
const KNOWN_PEOPLE = new Set(["Kerry", "Shan", "Adrian", "Brad", "Stephen"]);

export interface Comment {
	id: string;
	item: string;
	author: string;
	body: string;
	at: string;
}

function headers(origin: string | null) {
	return {
		"Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "null",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		Vary: "Origin",
		"Content-Type": "application/json",
		// Threads change the moment someone posts; a cached read would show a stale conversation.
		"Cache-Control": "no-store",
	};
}

function json(body: unknown, status: number, origin: string | null) {
	return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

/**
 * Tell the team a comment arrived, by posting to the site's own Netlify Form.
 *
 * A comment nobody sees is worse than the email it replaced, and Netlify Functions have no mail
 * transport of their own. Reusing the Forms notification that already exists (and already emails on
 * contact-form submissions) avoids adding a mail provider and another credential for one line of
 * text. Deliberately best-effort: a failed notification must never lose the comment itself, which
 * is already stored by the time this runs.
 */
async function notify(siteUrl: string, comment: Comment, itemLabel: string) {
	try {
		const body = new URLSearchParams({
			"form-name": "new-comment",
			item: comment.item,
			label: itemLabel,
			author: comment.author,
			comment: comment.body.slice(0, 800),
			at: comment.at,
			"bot-field": "",
		});
		await fetch(siteUrl, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: body.toString(),
		});
	} catch {
		/* Best effort only — see above. */
	}
}

export default async (request: Request, context: Context) => {
	const origin = request.headers.get("origin");

	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: headers(origin) });
	}

	// Same reasoning as `trigger-deploy`: blocks another *page* using a visitor's browser as a proxy.
	// A direct client can set whatever it likes, which is accepted (see the note at the top).
	if (origin && !ALLOWED_ORIGINS.has(origin)) {
		return json({ error: "Not allowed from this origin." }, 403, origin);
	}

	const store = getStore({ name: STORE, consistency: "strong" });

	if (request.method === "GET") {
		const url = new URL(request.url);
		// A single request for every thread on the page: one round trip on load rather than one per
		// item, which for ~30 items would be 30 cold-start-prone calls.
		const items = (url.searchParams.get("items") || "").split(",").map((s) => s.trim()).filter(Boolean);
		if (!items.length) return json({ threads: {} }, 200, origin);

		const entries = await Promise.all(
			items.slice(0, 100).map(async (item) => {
				const thread = ((await store.get(item, { type: "json" })) as Comment[] | null) ?? [];
				return [item, thread] as const;
			})
		);
		return json({ threads: Object.fromEntries(entries) }, 200, origin);
	}

	if (request.method !== "POST") {
		return json({ error: "Method not allowed." }, 405, origin);
	}

	let payload: { item?: string; author?: string; body?: string; label?: string };
	try {
		payload = await request.json();
	} catch {
		return json({ error: "Expected JSON." }, 400, origin);
	}

	const item = (payload.item || "").trim();
	const body = (payload.body || "").trim();

	/**
	 * Identity comes from the edge function when it can, and from the client's picker when it can't.
	 *
	 * `status-auth.ts` sets `x-status-user` on every request and overwrites whatever arrived, so
	 * under per-person logins (`STATUS_USERS`) it is a fact rather than a claim and outranks the
	 * dropdown. Under the shared login it is always "Souper", which identifies nobody — so that
	 * value is ignored and the self-declared name stands. Configuring `STATUS_USERS` therefore
	 * upgrades attribution from claimed to authenticated with no change here.
	 */
	const signedIn = (request.headers.get("x-status-user") || "").trim();
	const author = (KNOWN_PEOPLE.has(signedIn) ? signedIn : (payload.author || "").trim());

	if (!item || !author || !body) {
		return json({ error: "item, author and body are all required." }, 400, origin);
	}
	if (body.length > MAX_BODY_CHARS || author.length > MAX_NAME_CHARS) {
		return json({ error: "That comment is too long." }, 413, origin);
	}
	// Not a security control — anyone can claim any of these. It keeps the thread readable by
	// rejecting arbitrary strings, so an attribution always matches one of the five known people.
	if (!KNOWN_PEOPLE.has(author)) {
		return json({ error: "Unknown author." }, 400, origin);
	}
	// The id becomes a blob key, so it must not be able to reach outside the store.
	if (!/^[a-z0-9-]{1,64}$/i.test(item)) {
		return json({ error: "Bad item id." }, 400, origin);
	}

	const existing = ((await store.get(item, { type: "json" })) as Comment[] | null) ?? [];
	if (existing.length >= MAX_PER_ITEM) {
		return json({ error: "This thread is full." }, 409, origin);
	}

	const comment: Comment = {
		id: crypto.randomUUID(),
		item,
		author,
		body,
		at: new Date().toISOString(),
	};

	const thread = [...existing, comment];
	await store.setJSON(item, thread);

	// After the write, so a notification failure can never cost the comment.
	const siteUrl = context.site?.url || process.env.URL || "";
	if (siteUrl) {
		await notify(siteUrl, comment, (payload.label || "").slice(0, 200));
	} else {
		// The comment is safely stored either way, but an un-notified comment is the one failure
		// mode that makes this whole feature worse than the email it replaced — so it must not be
		// silent. Shows up in the Netlify function log.
		console.warn("comments: no site URL available, comment stored but nobody was notified");
	}

	return json({ comment, thread }, 201, origin);
};

export const config: Config = {
	path: "/api/comments",
};
