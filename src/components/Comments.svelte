<script lang="ts">
	/**
	 * A comment thread on one item of the update page.
	 *
	 * Replaced the copy-questions-into-an-email loop: the answer now stays next to the thing it
	 * answers and all five people can see it. Nothing is emailed when a comment arrives (see
	 * `netlify/functions/comments.mts` for why) — a thread is read when someone opens the page.
	 *
	 * ── Loading ──────────────────────────────────────────────────────────────────────────────────
	 * Threads are fetched **once for the whole page** by `commentStore`, not per component. There are
	 * around thirty of these on the page; thirty separate calls to a function that cold-starts would
	 * be slower than the email it replaces. Each instance subscribes to the shared result.
	 */
	import { onMount } from "svelte";
	import { commentStore } from "../lib/comments.svelte";

	/**
	 * `seed` is the item's fixed copy — the context we wrote, the reply that arrived by email, our
	 * response to it — expressed as timeline entries so it merges with the live comments rather than
	 * sitting above them in a different shape. Someone following the discussion shouldn't have to
	 * work out which parts were typed into the page's source and which into the box at the bottom.
	 */
	let {
		id,
		label,
		seed = [],
	}: { id: string; label: string; seed?: { author: string; at: string; body: string }[] } = $props();

	// Registers the id rather than fetching it — the store batches every id registered in the same
	// tick into a single request. See the note in `comments.svelte.ts`.
	onMount(() => commentStore.register(id));

	let draft = $state("");
	let sending = $state(false);
	let error = $state("");

	const live = $derived(commentStore.threads[id] ?? []);
	const loading = $derived(commentStore.loading);
	/**
	 * Who you are is not asked, it's known — the endpoint reads it from the login and ignores any
	 * name the page might send. Empty under a shared password, where nobody is identified.
	 */
	const signedInAs = $derived(commentStore.signedInAs);
	const identityKnown = $derived(commentStore.identityKnown);

	const thread = $derived(
		[
			...seed.map((entry, i) => ({ key: `seed-${i}`, ...entry })),
			...live.map((c) => ({ key: c.id, author: c.author, at: c.at, body: c.body })),
		].sort((a, b) => a.at.localeCompare(b.at))
	);

	const last = $derived(thread.length ? thread[thread.length - 1] : null);

	function when(iso: string) {
		const date = new Date(iso);
		return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
	}

	async function send() {
		if (!draft.trim() || !signedInAs) return;
		sending = true;
		error = "";
		try {
			await commentStore.add(id, draft.trim());
			draft = "";
		} catch (e) {
			error = e instanceof Error && e.message ? e.message : "That didn't send. Try again, or email us.";
		} finally {
			sending = false;
		}
	}
</script>

<!--
	The whole thread collapses, not just part of it. Everything here is background: the reason we
	asked, what came back, what we did about it. The question itself stays visible above, so the page
	still reads end to end as a list of what's being asked — the discussion is there when wanted.

	<details> rather than a scripted panel, matching the rest of the page: keyboard operable and
	screen-reader announced for free, opens on find-in-page, and prints expanded via the beforeprint
	handler in request-for-comment.astro.
-->
<details class="cm">
	<summary>
		<span class="cm-summary">
			{thread.length}
			{thread.length === 1 ? "comment" : "comments"}
			{#if last}<span class="cm-latest">latest {last.author}, {when(last.at)}</span>{/if}
		</span>
	</summary>

	{#if thread.length}
		<ul class="cm-list">
			{#each thread as entry (entry.key)}
				<li>
					<p class="cm-meta"><strong>{entry.author}</strong> <span>{when(entry.at)}</span></p>
					<!-- Plain text, rendered as text. The endpoint is behind Basic auth and the five
					     people are trusted, which is exactly the reasoning that ends in a stored XSS
					     one day — nothing typed into a box gets parsed as markup. -->
					<p class="cm-body">{entry.body}</p>
				</li>
			{/each}
		</ul>
	{/if}

	<!--
		The box is always here once the thread is open, rather than behind a Reply button. Opening a
		thread is already the intent — a second click to reveal an empty textarea asked people to
		declare that intent twice, and an empty box is the more inviting and more familiar shape.
	-->
	<!--
		There is no "commenting as" picker. Everyone reaches this page through their own login, so the
		name is already known — asking a signed-in person to choose it from a dropdown read as the
		login not having taken, and was worse than redundant besides, since the endpoint overrules
		whatever was chosen. A control that offers a choice it doesn't honour is a lie about the system.

		The box only appears once the server has said who is here, rather than assuming nobody until
		told otherwise: a thread opened during that first round trip would otherwise tell a signed-in
		reader to sign in.
	-->
	{#if signedInAs}
		<div class="cm-form">
			<p class="cm-who">Commenting as <strong>{signedInAs}</strong></p>
			<textarea
				bind:value={draft}
				rows="3"
				placeholder={thread.length ? "Reply..." : "Your answer, or anything you want to flag..."}
				aria-label={`Comment on: ${label}`}
			></textarea>
			<div class="cm-actions">
				<button type="button" class="cm-send" onclick={send} disabled={sending || !draft.trim()}>
					{sending ? "Posting..." : "Post comment"}
				</button>
				{#if loading}<span class="cm-loading">Loading comments...</span>{/if}
			</div>
			{#if error}<p class="cm-error">{error}</p>{/if}
		</div>
	{:else if identityKnown}
		<p class="cm-who cm-signed-out">
			This page is open with a shared password, so comments can't be signed. Ask us for your own
			login and the box will appear here.
		</p>
	{/if}
</details>

<style>
	.cm {
		margin-top: 0.6rem;
		/**
		 * `width: 100%` looks redundant on a block element and is not. `.card` is a column flex
		 * container with `align-items: flex-start`, so its children are shrink-to-fit — a <details>
		 * dropped in there collapses to the width of its own summary (measured: 94px in a 337px
		 * card), taking the textarea with it. Setting the width rather than `align-self: stretch`
		 * because it holds in a grid or an inline-flex parent too, and this component is placed in
		 * three different containers on the page.
		 */
		width: 100%;
		max-width: 62ch;
	}

	.cm[open] {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Styled as the same quiet text control as "Why we're asking" was, so the page keeps one
	   vocabulary for "there is more here if you want it". */
	.cm > summary {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--st-teal-dark, #148294);
		text-decoration: underline;
		text-underline-offset: 2px;
		list-style: none;
		width: fit-content;
	}

	.cm > summary::-webkit-details-marker {
		display: none;
	}

	.cm > summary::after {
		content: "";
		width: 6px;
		height: 6px;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(45deg) translate(-1px, -1px);
		transition: transform 0.15s ease;
	}

	.cm[open] > summary::after {
		transform: rotate(-135deg) translate(-2px, -2px);
	}

	.cm > summary:focus-visible {
		outline: 2px solid var(--st-teal, #1babbe);
		outline-offset: 3px;
		border-radius: 3px;
	}

	/* Who spoke last and when, without opening it — the one thing worth knowing from the outside. */
	.cm-latest {
		font-weight: 400;
		color: rgba(36, 35, 43, 0.65);
		text-decoration: none;
	}

	.cm-latest::before {
		content: "\00b7";
		margin: 0 0.35rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.cm > summary::after {
			transition: none;
		}
	}

	@media print {
		.cm > summary {
			display: none;
		}
	}

	.cm-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* A left rule rather than a filled panel: the answer block above these is already a tinted box,
	   and stacking a second fill on it reads as a box inside a box. */
	.cm-list li {
		padding-left: 0.75rem;
		border-left: 2px solid rgba(27, 171, 190, 0.35);
	}

	.cm-meta {
		font-size: 0.78rem;
		color: rgba(36, 35, 43, 0.65);
	}

	.cm-meta strong {
		color: var(--st-ink, #24232b);
		font-weight: 700;
	}

	.cm-meta span::before {
		content: "\00b7";
		margin: 0 0.35rem;
	}

	.cm-body {
		font-size: 0.92rem;
		color: var(--st-ink, #24232b);
		/* Authors type line breaks and expect to keep them; nothing else about the text is formatted. */
		white-space: pre-wrap;
	}

	/* Set off from the conversation above it: it's a control, not another entry, and at the flex
	   gap alone it read as one. */
	.cm-form {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.cm-who {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: rgba(36, 35, 43, 0.65);
	}

	/* The name itself is content, not a label, so it sits at full ink like an author line above. */
	.cm-who strong {
		color: var(--st-ink, #24232b);
		font-weight: 700;
	}

	.cm-signed-out {
		margin-top: 1rem;
		font-weight: 400;
		max-width: 48ch;
	}

	.cm-form textarea {
		font: inherit;
		font-size: 0.9rem;
		width: 100%;
		resize: vertical;
		padding: 0.4rem 0.6rem;
		border: 1px solid rgba(36, 35, 43, 0.25);
		border-radius: 8px;
		background: var(--st-white, #fff);
		color: var(--st-ink, #24232b);
	}

	.cm-send {
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		cursor: pointer;
		color: var(--st-white, #fff);
		background: var(--st-teal-dark, #148294);
		border: 1px solid var(--st-teal-dark, #148294);
	}

	.cm-send:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.cm-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}

	.cm-error {
		font-size: 0.82rem;
		color: #8a2b2b;
	}

	/* A printout is a snapshot to read away from the screen — the controls are noise, the
	   conversation is not. */
	@media print {
		.cm-form,
		.cm-loading {
			display: none;
		}
	}
</style>
