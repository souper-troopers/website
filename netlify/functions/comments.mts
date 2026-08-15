import type { Config } from "@netlify/functions";
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
 *   - **Authentication is handled upstream**, by `netlify/edge-functions/status-auth.ts`, which
 *     covers this path as well as the pages. Nothing unauthenticated reaches here — and the function
 *     is not separately reachable at `/.netlify/functions/comments`, which 404s: declaring a `path`
 *     in the config below replaces the default endpoint rather than adding to it. Verified against
 *     production, because a second door past the edge function would undo all of the above.
 *   - **A comment can only be attributed to whoever signed in.** The name is read from the header
 *     the edge function controls and from nowhere else, so posting as somebody else is not possible
 *     even with valid credentials. That requires per-person logins (`STATUS_USERS`); under a shared
 *     password nobody is identified, and writes are refused rather than guessed at.
 *   - **Nothing is emailed when a comment arrives** (decided 2026-08-15). It was built and then
 *     removed: the notification depended on a Netlify Forms notification address that was never
 *     configured, so it posted into the void while the code read as though it worked — worse than
 *     not having it. Netlify Forms submissions are free and unlimited on credit-based plans, so
 *     cost was never the reason. The trade is real and accepted: **a comment is seen when someone
 *     opens the page**, so during an active review somebody has to look. Restoring it is a small
 *     function that POSTs to a `new-comment` form plus a notification address in the dashboard.
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

export interface Comment {
	id: string;
	item: string;
	author: string;
	body: string;
	at: string;
}

/**
 * Who signed in — the only source of a name on this endpoint.
 *
 * `status-auth.ts` sets `x-status-user` on every request under per-person logins and **deletes** it
 * otherwise, so the browser can neither forge nor retain one. There is deliberately no list of
 * expected names here: the names come from the usernames in `STATUS_USERS`, and a second copy would
 * mean adding a login for a new colleague silently left them unable to comment. The check below is
 * a sanity bound on a malformed environment variable, not an authorisation decision — that was made
 * at the edge, by a password.
 */
function signedInPerson(request: Request): string | null {
	const name = (request.headers.get("x-status-user") || "").trim();
	if (!name || name.length > MAX_NAME_CHARS) return null;
	return /^[\p{L}\p{M}'’ -]+$/u.test(name) ? name : null;
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

export default async (request: Request) => {
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
		/**
		 * The response carries `you` as well as the threads.
		 *
		 * The page is static HTML built once, so it cannot know who is reading it — only a request can,
		 * and this is the one request every reader already makes on load. Without it the page has to
		 * ask a signed-in person to name themselves in a dropdown, having just authenticated them,
		 * which reads as the login not having worked. Null under the shared password, where nobody is
		 * identified and the dropdown is genuinely the only source of a name.
		 */
		const you = signedInPerson(request);
		// A single request for every thread on the page: one round trip on load rather than one per
		// item, which for ~30 items would be 30 cold-start-prone calls.
		const items = (url.searchParams.get("items") || "").split(",").map((s) => s.trim()).filter(Boolean);
		if (!items.length) return json({ threads: {}, you }, 200, origin);

		const entries = await Promise.all(
			items.slice(0, 100).map(async (item) => {
				const thread = ((await store.get(item, { type: "json" })) as Comment[] | null) ?? [];
				return [item, thread] as const;
			})
		);
		return json({ threads: Object.fromEntries(entries), you }, 200, origin);
	}

	if (request.method !== "POST") {
		return json({ error: "Method not allowed." }, 405, origin);
	}

	let payload: { item?: string; body?: string };
	try {
		payload = await request.json();
	} catch {
		return json({ error: "Expected JSON." }, 400, origin);
	}

	const item = (payload.item || "").trim();
	const body = (payload.body || "").trim();

	/**
	 * The author is never taken from the request body. It was, when a shared password meant the
	 * browser held the only name — but a payload field is a claim, and the moment identity became a
	 * fact, accepting a claim alongside it just left the weaker path open. Anyone who can post is
	 * signed in as themselves by definition now.
	 */
	const author = signedInPerson(request);
	if (!author) {
		return json({ error: "Sign in with your own login to comment." }, 401, origin);
	}

	if (!item || !body) {
		return json({ error: "item and body are both required." }, 400, origin);
	}
	if (body.length > MAX_BODY_CHARS) {
		return json({ error: "That comment is too long." }, 413, origin);
	}
	// The id becomes a blob key, so it must not be able to reach outside the store.
	if (!/^[a-z0-9-]{1,64}$/i.test(item)) {
		return json({ error: "Bad item id." }, 400, origin);
	}

	const comment: Comment = {
		id: crypto.randomUUID(),
		item,
		author,
		body,
		at: new Date().toISOString(),
	};

	/**
	 * Append with a compare-and-swap where the platform allows one, retrying if someone else got in
	 * first.
	 *
	 * A thread is one blob, so adding a comment is read-modify-write, and two people posting to the
	 * same thread within the same second would otherwise have one silently overwrite the other.
	 * `onlyIfMatch` makes the write conditional on the blob still being the revision we read.
	 *
	 * **This is why a thread is one blob rather than one blob per comment**, which would make
	 * appends conflict-free. Netlify Blobs' `list()` returns keys only, never values, so reading a
	 * thread would cost one `list` plus one `get` per comment — for this page's single bulk read of
	 * ~30 threads that is roughly 120 round trips instead of 30. A retry on a rare collision is far
	 * cheaper than quadrupling every read.
	 *
	 * ⚠ **The local emulator never returns an ETag on GET** (see `getLocalPaths`/`get` in
	 * `@netlify/blobs/dist/server.js` — it sets only the metadata header), so `getWithMetadata`
	 * yields `etag: undefined` under `netlify dev`. Requiring a condition there breaks *every*
	 * append after the first, which is exactly what it did before this fallback existed. When no
	 * ETag is available the write goes ahead unconditionally: that is last-write-wins, which is no
	 * worse than having no CAS at all, and it keeps local development working. Production returns
	 * real ETags, so the guard is live where it matters — **and cannot be tested locally.**
	 */
	let thread: Comment[] = [];
	for (let attempt = 0; ; attempt++) {
		const current = await store.getWithMetadata(item, { type: "json" });
		const existing = (current?.data as Comment[] | null) ?? [];
		if (existing.length >= MAX_PER_ITEM) {
			return json({ error: "This thread is full." }, 409, origin);
		}
		thread = [...existing, comment];

		if (!current?.etag) {
			await store.setJSON(item, thread);
			break;
		}

		const result = await store.setJSON(item, thread, { onlyIfMatch: current.etag });
		if (result.modified) break;
		if (attempt >= 3) {
			return json({ error: "That thread is busy - try again in a moment." }, 409, origin);
		}
	}

	return json({ comment, thread }, 201, origin);
};

export const config: Config = {
	path: "/api/comments",
};
