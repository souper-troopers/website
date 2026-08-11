<script>
	let { value, label } = $props();

	let copied = $state(false);
	let resetTimer;

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			// Fallback for older browsers / denied clipboard permission
			const input = document.createElement("input");
			input.value = value;
			input.setAttribute("readonly", "");
			input.style.position = "absolute";
			input.style.left = "-9999px";
			document.body.appendChild(input);
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
		}
		copied = true;
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => {
			copied = false;
		}, 1500);
	}
</script>

<button
	type="button"
	class="copy-button"
	class:is-copied={copied}
	onclick={copy}
	aria-label={copied ? `${label} copied` : `Copy ${label}`}
	title={copied ? "Copied" : "Copy"}
>
	{#if copied}
		<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
			<path fill="currentColor" d="M9.5 16.2 5.3 12l1.4-1.4 2.8 2.8 7.2-7.2L18.1 7.6z" />
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
			<path
				fill="currentColor"
				d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
			/>
		</svg>
	{/if}
</button>
<span class="copy-status" aria-live="polite">{copied ? "Copied to clipboard" : ""}</span>

<style>
	.copy-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin: 0;
		border: none;
		background: none;
		/* Set --copy-button-color on an ancestor to re-tint this against a dark background. */
		color: var(--copy-button-color, var(--st-teal-dark, #148294));
		/* Was 0.4, which put this control at 1.72:1 against white — below the 3:1 an icon button
		   needs, so a real action (copying the EFT account number on the donate page) was nearly
		   invisible until hovered. 0.85 keeps it deliberately quiet but legible (3.5:1 on white,
		   4.47:1 on the footer's ink), and hover/focus now brightens to full rather than up from 0.4. */
		opacity: 0.85;
		cursor: pointer;
		vertical-align: baseline;
		transform: translateY(0.1em);
		transition: opacity 0.15s ease, color 0.15s ease;
		font: inherit;
		line-height: 1;
	}

	.copy-button:hover,
	.copy-button:focus-visible {
		opacity: 1;
	}

	.copy-button:focus-visible {
		outline: 2px solid var(--st-teal, #1babbe);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.copy-button.is-copied {
		opacity: 1;
		color: var(--st-green, #4bbc63);
	}

	.copy-status {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
