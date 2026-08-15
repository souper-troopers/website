<script lang="ts">
	/**
	 * "Mark as done" for the handful of questions that ask Kerry or Shan to *do* something outside
	 * this site — set up the Google listing, ask Werksmans, check the consent forms.
	 *
	 * **Why only those.** For almost every other question the answer *is* the completion: when Kerry
	 * tells us the postal code, that reply is the signal, and a button beside it would be bookkeeping
	 * on top of the thing that already worked. The "ask someone else" items are the ones with no
	 * natural signal — they happen elsewhere, over weeks, and nothing tells us they happened.
	 *
	 * **It posts to us, and that is the whole point.** A checkbox saved only in the browser would
	 * look like sign-off without being it: ticked, assumed known, never received — and invisible to
	 * whichever of the two of them didn't click it. This submits to Netlify Forms (the same
	 * mechanism as the contact form), so it lands in the dashboard and emails a notification.
	 * localStorage is used *as well*, to keep the button ticked on return, never instead.
	 */
	import { onMount } from "svelte";

	let { id, title }: { id: string; title: string } = $props();

	const STORAGE_KEY = "st-done-v1";

	type State = "idle" | "sending" | "done" | "error";
	let state = $state<State>("idle");
	let name = $state("");
	let asking = $state(false);

	/**
	 * Reading localStorage is wrapped because Safari private browsing can throw on access — the same
	 * hazard already noted for the cart in AGENTS.md. A failure here must leave the button usable
	 * rather than break the component.
	 */
	function readDone(): Record<string, string> {
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
		} catch {
			return {};
		}
	}

	onMount(() => {
		if (readDone()[id]) state = "done";
	});

	async function submit() {
		if (!name.trim()) return;
		state = "sending";
		try {
			const body = new URLSearchParams({
				"form-name": "task-done",
				task: id,
				title,
				name: name.trim(),
				"marked-at": new Date().toISOString(),
				"bot-field": "",
			});
			const response = await fetch("/", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: body.toString(),
			});
			if (!response.ok) throw new Error(String(response.status));
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readDone(), [id]: name.trim() }));
			} catch {
				// Persisting is only a convenience; the submission has already reached us, which is
				// the part that matters. Failing to remember it locally must not report an error.
			}
			state = "done";
			asking = false;
		} catch {
			state = "error";
		}
	}

	function undo() {
		try {
			const done = readDone();
			delete done[id];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
		} catch {
			/* nothing to undo locally */
		}
		state = "idle";
		asking = false;
	}
</script>

{#if state === "done"}
	<p class="md-done">
		<span class="md-tick" aria-hidden="true">✓</span>
		Marked as done - thank you, that's come through to us.
		<!-- Undo clears the local tick only. The submission has already been sent and can't be
		     unsent, so the wording promises nothing more than it does. -->
		<button type="button" class="md-undo" onclick={undo}>Not done after all?</button>
	</p>
{:else if asking}
	<div class="md-ask">
		<label for={`md-name-${id}`}>Who's marking this done?</label>
		<div class="md-row">
			<input
				id={`md-name-${id}`}
				type="text"
				bind:value={name}
				placeholder="Your name"
				autocomplete="given-name"
				onkeydown={(e) => e.key === "Enter" && submit()}
			/>
			<button type="button" class="md-send" onclick={submit} disabled={state === "sending" || !name.trim()}>
				{state === "sending" ? "Sending..." : "Send"}
			</button>
			<button type="button" class="md-cancel" onclick={() => (asking = false)}>Cancel</button>
		</div>
		{#if state === "error"}
			<p class="md-error">That didn't send - worth telling us by email instead, so it isn't lost.</p>
		{/if}
	</div>
{:else}
	<button type="button" class="md-start" onclick={() => (asking = true)}>Mark this as done</button>
{/if}

<style>
	/* Outlined rather than filled: this sits inside a question that already has a highlighted ask and
	   sometimes a reply panel, and a solid button would outrank both. Teal is correct here — it is
	   genuinely an action (see the affordance note in AGENTS.md). */
	.md-start {
		align-self: flex-start;
		margin-top: 0.55rem;
		padding: 0.4rem 0.9rem;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--st-teal-dark, #148294);
		background: transparent;
		border: 1px solid var(--st-teal, #1babbe);
		border-radius: 999px;
		cursor: pointer;
	}

	.md-start:hover {
		background: rgba(27, 171, 190, 0.1);
	}

	.md-ask {
		margin-top: 0.55rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.md-ask label {
		font-size: 0.8rem;
		font-weight: 600;
		color: rgba(36, 35, 43, 0.65);
	}

	.md-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	/* Asked for because two people share this page and "done" is not useful without knowing which of
	   them did it — and because it is the only thing standing between a stray click and a
	   notification claiming the Google listing exists. */
	.md-row input {
		font: inherit;
		font-size: 0.88rem;
		padding: 0.35rem 0.6rem;
		border: 1px solid rgba(36, 35, 43, 0.25);
		border-radius: 8px;
		min-width: 8rem;
		flex: 1 1 8rem;
		max-width: 14rem;
	}

	.md-send,
	.md-cancel {
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.md-send {
		color: var(--st-white, #fff);
		background: var(--st-teal-dark, #148294);
		border: 1px solid var(--st-teal-dark, #148294);
	}

	.md-send:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.md-cancel {
		color: rgba(36, 35, 43, 0.65);
		background: transparent;
		border: 1px solid rgba(36, 35, 43, 0.2);
	}

	.md-done {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.4rem;
		margin-top: 0.55rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: #2f7a44;
	}

	.md-tick {
		font-size: 0.95rem;
	}

	.md-undo {
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		color: rgba(36, 35, 43, 0.65);
		background: none;
		border: none;
		padding: 0;
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.md-error {
		font-size: 0.82rem;
		color: #8a2b2b;
	}

	@media print {
		.md-start,
		.md-ask {
			display: none;
		}
	}
</style>
