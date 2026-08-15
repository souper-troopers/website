<script lang="ts">
	/**
	 * A comment thread on one item of the update page.
	 *
	 * Replaces the copy-questions-into-an-email loop with answering in place, where the answer stays
	 * next to the thing it answers and all five people can see it. Email still works and nobody is
	 * being forced off it — this is the better path, not the only one.
	 *
	 * ── Loading ──────────────────────────────────────────────────────────────────────────────────
	 * Threads are fetched **once for the whole page** by `commentStore`, not per component. There are
	 * around thirty of these on the page; thirty separate calls to a function that cold-starts would
	 * be slower than the email it replaces. Each instance subscribes to the shared result.
	 */
	import { onMount } from "svelte";
	import { clientPeople, projectPeople } from "../lib/people";
	import { commentStore } from "../lib/comments.svelte";

	let { id, label }: { id: string; label: string } = $props();

	// Registers the id rather than fetching it — the store batches every id registered in the same
	// tick into a single request. See the note in `comments.svelte.ts`.
	onMount(() => commentStore.register(id));

	const people = [...clientPeople, ...projectPeople];

	let draft = $state("");
	let author = $state("");
	let open = $state(false);
	let sending = $state(false);
	let error = $state("");

	const thread = $derived(commentStore.threads[id] ?? []);
	const loading = $derived(commentStore.loading);

	// Who you are is asked once per browser rather than once per comment — on a page with thirty
	// threads, re-picking a name every time is the thing that would stop people using it.
	$effect(() => {
		if (!author) author = commentStore.rememberedAuthor;
	});

	function when(iso: string) {
		const date = new Date(iso);
		return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
	}

	async function send() {
		if (!draft.trim() || !author) return;
		sending = true;
		error = "";
		try {
			await commentStore.add(id, author, draft.trim(), label);
			draft = "";
			open = false;
		} catch (e) {
			error = e instanceof Error && e.message ? e.message : "That didn't send. Try again, or email us.";
		} finally {
			sending = false;
		}
	}
</script>

<div class="cm">
	{#if thread.length}
		<ul class="cm-list">
			{#each thread as comment (comment.id)}
				<li>
					<p class="cm-meta"><strong>{comment.author}</strong> <span>{when(comment.at)}</span></p>
					<!-- Plain text, rendered as text. Nothing here is parsed as markup: five trusted
					     people or not, an unauthenticated endpoint must not be able to inject HTML. -->
					<p class="cm-body">{comment.body}</p>
				</li>
			{/each}
		</ul>
	{/if}

	{#if open}
		<div class="cm-form">
			<label class="cm-who">
				<span>Commenting as</span>
				<select bind:value={author}>
					<option value="" disabled>Choose...</option>
					{#each people as person}
						<option value={person}>{person}</option>
					{/each}
				</select>
			</label>
			<textarea
				bind:value={draft}
				rows="3"
				placeholder="Your answer, or anything you want to flag..."
				aria-label={`Comment on: ${label}`}
			></textarea>
			<div class="cm-actions">
				<button type="button" class="cm-send" onclick={send} disabled={sending || !draft.trim() || !author}>
					{sending ? "Posting..." : "Post comment"}
				</button>
				<button type="button" class="cm-cancel" onclick={() => (open = false)}>Cancel</button>
			</div>
			{#if error}<p class="cm-error">{error}</p>{/if}
		</div>
	{:else}
		<button type="button" class="cm-open" onclick={() => (open = true)}>
			{thread.length ? "Reply" : "Comment"}
			{#if thread.length}<span class="cm-count">{thread.length}</span>{/if}
		</button>
		{#if loading && !thread.length}<span class="cm-loading">Loading comments...</span>{/if}
	{/if}
</div>

<style>
	.cm {
		margin-top: 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		max-width: 62ch;
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

	.cm-open {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.75rem;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--st-teal-dark, #148294);
		background: transparent;
		border: 1px solid rgba(27, 171, 190, 0.5);
		border-radius: 999px;
		cursor: pointer;
	}

	.cm-open:hover {
		background: rgba(27, 171, 190, 0.1);
	}

	.cm-count {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.05rem 0.35rem;
		border-radius: 999px;
		background: rgba(27, 171, 190, 0.18);
	}

	.cm-loading {
		font-size: 0.78rem;
		color: rgba(36, 35, 43, 0.65);
	}

	.cm-form {
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

	.cm-who select,
	.cm-form textarea {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid rgba(36, 35, 43, 0.25);
		border-radius: 8px;
		background: var(--st-white, #fff);
		color: var(--st-ink, #24232b);
	}

	.cm-who select {
		min-height: 32px;
	}

	.cm-form textarea {
		width: 100%;
		resize: vertical;
	}

	.cm-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.cm-send,
	.cm-cancel {
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.cm-send {
		color: var(--st-white, #fff);
		background: var(--st-teal-dark, #148294);
		border: 1px solid var(--st-teal-dark, #148294);
	}

	.cm-send:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.cm-cancel {
		color: rgba(36, 35, 43, 0.65);
		background: transparent;
		border: 1px solid rgba(36, 35, 43, 0.2);
	}

	.cm-error {
		font-size: 0.82rem;
		color: #8a2b2b;
	}

	/* A printout is a snapshot to read away from the screen — the controls are noise, the
	   conversation is not. */
	@media print {
		.cm-open,
		.cm-form,
		.cm-loading {
			display: none;
		}
	}
</style>
