<script>
	import CopyButton from "./CopyButton.svelte";

	let { address, subject = undefined } = $props();

	const href = $derived(
		subject
			? `mailto:${address}?subject=${encodeURIComponent(subject)}`
			: `mailto:${address}`
	);
</script>

<span class="email-link">
	<a {href}>{address}</a>
	<CopyButton value={address} label={address} />
</span>

<style>
	.email-link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.2em;
		white-space: nowrap;
	}
</style>
