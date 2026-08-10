<script>
	import CopyButton from "./CopyButton.svelte";

	let { lines, copyable = true } = $props();

	const oneLine = $derived(lines.join(", "));
	const mapsHref = $derived(
		`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(oneLine)}`
	);

	// Each comma-separated part is kept whole so a narrow screen wraps between them rather than
	// mid-place-name ("Cape / Town").
	const segmentedLines = $derived(
		lines.map((line) => {
			const parts = line.split(", ");
			return parts.map((part, index) => (index < parts.length - 1 ? `${part},` : part));
		})
	);
</script>

<span class="address-link"><a
		href={mapsHref}
		target="_blank"
		rel="noopener"
		title="Open in Google Maps"
	>{#each segmentedLines as segments, lineIndex}{#if lineIndex > 0}<br />{/if}{#each segments as segment, segmentIndex}{#if segmentIndex > 0}{" "}{/if}<span
					class="address-segment">{segment}</span>{/each}{/each}</a>{#if copyable}<CopyButton
			value={oneLine}
			label="address"
		/>{/if}</span>

<style>
	/* Plain inline (not inline-flex) so the copy button follows the address's *last* line — flex
	   alignment can only reach the top or bottom edge of the whole multi-line block. */
	.address-link {
		display: inline;
	}

	.address-segment {
		white-space: nowrap;
	}

	.address-link :global(.copy-button) {
		margin-left: 0.2em;
	}
</style>
