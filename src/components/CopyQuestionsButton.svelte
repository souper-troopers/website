<script lang="ts">
	let {
		text,
		label = "Copy questions for email",
		hint,
		copiedHint = "Paste it into an email and answer under each one.",
	} = $props<{
		text: string;
		/** Button text in its resting state. */
		label?: string;
		/**
		 * Line under the button before copying. Defaults to counting the numbered questions in `text`,
		 * which only makes sense for the request-for-comment list — pass this for any other payload.
		 */
		hint?: string;
		/** Line under the button after a successful copy. */
		copiedHint?: string;
	}>();

	const restingHint = $derived(
		hint ??
			`Copies all ${text.split("\n").filter((line) => /^\d+\./.test(line)).length} questions as a list you can paste into an email and answer under each one.`
	);

	let copied = $state(false);
	let failed = $state(false);
	let resetTimer: ReturnType<typeof setTimeout>;

	async function copy() {
		failed = false;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// navigator.clipboard is unavailable over plain http and can be permission-denied, so fall
			// back to the old selection-based copy before admitting defeat.
			try {
				const area = document.createElement("textarea");
				area.value = text;
				area.setAttribute("readonly", "");
				area.style.position = "absolute";
				area.style.left = "-9999px";
				document.body.appendChild(area);
				area.select();
				document.execCommand("copy");
				document.body.removeChild(area);
			} catch {
				failed = true;
			}
		}
		if (!failed) copied = true;
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => {
			copied = false;
			failed = false;
		}, 2500);
	}
</script>

<div class="copy-questions">
	<button type="button" class="btn btn-secondary" class:is-copied={copied} onclick={copy}>
		{#if copied}
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path fill="currentColor" d="M9.5 16.2 5.3 12l1.4-1.4 2.8 2.8 7.2-7.2L18.1 7.6z" />
			</svg>
			Copied
		{:else}
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path
					fill="currentColor"
					d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
				/>
			</svg>
			{label}
		{/if}
	</button>
	<p class="copy-questions-hint" aria-live="polite">
		{#if copied}
			{copiedHint}
		{:else if failed}
			Couldn't copy automatically - please select the text above and copy it by hand.
		{:else}
			{restingHint}
		{/if}
	</p>
</div>

<style>
	.copy-questions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		max-width: 28ch;
	}

	.copy-questions button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border: none;
		cursor: pointer;
		font: inherit;
		font-weight: 700;
		white-space: nowrap;
	}

	.copy-questions button.is-copied {
		background: var(--st-green, #4bbc63);
		color: #fff;
	}

	.copy-questions-hint {
		font-size: 0.8rem;
		line-height: 1.5;
		color: rgba(36, 35, 43, 0.5);
	}
</style>
