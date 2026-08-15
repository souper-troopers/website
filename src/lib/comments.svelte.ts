/**
 * Shared client state for the update page's comment threads.
 *
 * Exists so the page makes **one** request for every thread rather than one per component. There
 * are around thirty threads on `/request-for-comment`; thirty parallel calls to a function that
 * cold-starts would be slower and flakier than the email this replaces, and would look like the
 * page hanging. Each `Comments.svelte` instance registers the id it needs, the ids are gathered
 * across a microtask, and a single fetch answers all of them.
 *
 * Runes rather than a Svelte 4 store, per the project's stated convention — hence the
 * `.svelte.ts` extension, without which `$state` is not compiled.
 */

export interface Comment {
	id: string;
	item: string;
	author: string;
	body: string;
	at: string;
}

const ENDPOINT_PATH = "/api/comments";
const AUTHOR_KEY = "st-comment-author-v1";

/**
 * Built from `location.origin` rather than used as a relative path.
 *
 * The page sits behind HTTP Basic auth, and a relative URL resolves against `document.baseURI` — so
 * if anyone reaches the page through an address with credentials in it (`https://user:pass@host/…`,
 * which browsers do produce, and which is the obvious way to share a password-protected link), every
 * fetch throws `Request cannot be constructed from a URL that includes credentials` and the threads
 * silently never load. `location.origin` excludes credentials by definition, so this is immune.
 */
function endpoint(query = ""): string {
	const base = typeof location !== "undefined" ? location.origin : "";
	return `${base}${ENDPOINT_PATH}${query}`;
}

class CommentStore {
	threads = $state<Record<string, Comment[]>>({});
	loading = $state(false);
	/** Asked once per browser, not once per comment — see the note in `Comments.svelte`. */
	rememberedAuthor = $state("");

	#pending = new Set<string>();
	#scheduled = false;

	constructor() {
		if (typeof localStorage !== "undefined") {
			try {
				this.rememberedAuthor = localStorage.getItem(AUTHOR_KEY) || "";
			} catch {
				/* Safari private browsing can throw on access; a missing name is not an error. */
			}
		}
	}

	#loadedAll = false;

	/**
	 * Called by each thread as it mounts.
	 *
	 * The first call fetches **every** thread on the page in one request, using the id list the page
	 * publishes on `window.__rfcCommentIds`. Batching by microtask alone was not enough: the threads
	 * are `client:visible`, so they hydrate one at a time as the reader scrolls and never share a
	 * tick — measured as one request per thread, which is what the shared store existed to avoid.
	 * The id list is known at build time, so there is no reason to discover it by waiting.
	 *
	 * The microtask batch is kept as the fallback for when that list isn't present.
	 */
	register(id: string) {
		if (id in this.threads) return;

		// Returns while the bulk request is still in flight, not just after it lands. The published
		// list is complete by construction, so anything registering later is already covered — and
		// without this early return, every thread hydrating during that window queued a second
		// request for itself.
		if (this.#loadedAll) return;

		const all = (globalThis as { __rfcCommentIds?: string[] }).__rfcCommentIds;
		if (all?.length) {
			this.#loadedAll = true;
			void this.#load(all);
			return;
		}

		this.#pending.add(id);
		if (this.#scheduled) return;
		this.#scheduled = true;
		queueMicrotask(() => {
			this.#scheduled = false;
			void this.#load([...this.#pending]);
			this.#pending.clear();
		});
	}

	async #load(ids: string[]) {
		if (!ids.length) return;
		this.loading = true;
		try {
			const response = await fetch(endpoint(`?items=${encodeURIComponent(ids.join(","))}`));
			if (!response.ok) throw new Error(String(response.status));
			const data = (await response.json()) as { threads: Record<string, Comment[]> };
			// Seed every requested id, including the empty ones, so `register` doesn't re-queue them.
			this.threads = { ...this.threads, ...Object.fromEntries(ids.map((id) => [id, []])), ...data.threads };
		} catch {
			// Silent: an unreachable endpoint should leave the page looking like a page with no
			// comments yet, not like a broken one. Posting still surfaces its own errors.
			this.threads = { ...this.threads, ...Object.fromEntries(ids.map((id) => [id, this.threads[id] ?? []])) };
		} finally {
			this.loading = false;
		}
	}

	async add(item: string, author: string, body: string) {
		const response = await fetch(endpoint(), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ item, author, body }),
		});
		if (!response.ok) {
			const detail = await response.json().catch(() => ({}));
			throw new Error(detail?.error || "That didn't send. Try again, or email us.");
		}
		const data = (await response.json()) as { thread: Comment[] };
		// The server's copy of the thread wins, so a comment posted by someone else in the meantime
		// appears rather than being overwritten by a locally-appended guess.
		this.threads = { ...this.threads, [item]: data.thread };
		this.rememberedAuthor = author;
		try {
			localStorage.setItem(AUTHOR_KEY, author);
		} catch {
			/* Remembering is a convenience; the comment is already posted. */
		}
	}
}

export const commentStore = new CommentStore();
