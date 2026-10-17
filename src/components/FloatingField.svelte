<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	/**
	 * A text field whose label sits inside it like a placeholder and floats up above the text once
	 * the field is focused or has a value (17 October, the cart's checkout form). It is a real
	 * <label for>, not a placeholder, so screen readers announce it and it never disappears.
	 *
	 * Floated when focused, when it has a value, or when the browser has autofilled it (autofill
	 * can set the value before Svelte hears an input event, hence the :autofill rule as well).
	 */
	interface Props {
		label: string;
		value: string;
		type?: "text" | "email" | "tel";
		required?: boolean;
		autocomplete?: HTMLInputAttributes["autocomplete"];
		maxlength?: number;
	}

	let { label, value = $bindable(""), type = "text", required = false, autocomplete, maxlength }: Props = $props();

	const id = $props.id();
	let focused = $state(false);
	const floated = $derived(focused || value !== "");
</script>

<div class="field" class:floated>
	<input
		{id}
		{type}
		{required}
		{autocomplete}
		{maxlength}
		bind:value
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
	/>
	<label for={id}>{label}</label>
</div>

<style>
	.field {
		position: relative;
	}

	input {
		box-sizing: border-box;
		width: 100%;
		height: 50px;
		padding: 20px 0.75rem 6px;
		border: 1px solid rgba(36, 35, 43, 0.35);
		border-radius: 10px;
		font: inherit;
		font-size: 0.95rem;
		background: #fff;
		color: var(--st-ink, #24232b);
	}

	input:focus {
		outline: 2px solid var(--st-teal-dark, #148294);
		outline-offset: 1px;
		border-color: transparent;
	}

	/* At rest the label reads as a placeholder (muted ink at 0.7, 5.8:1 on white); floated it is
	   small and sits above the text, inside the field's top padding. */
	label {
		position: absolute;
		left: calc(0.75rem + 1px);
		top: 50%;
		transform: translateY(-50%);
		transform-origin: left top;
		font-size: 0.95rem;
		color: rgba(36, 35, 43, 0.7);
		pointer-events: none;
		transition: top 0.15s ease, transform 0.15s ease, font-size 0.15s ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: calc(100% - 1.5rem);
	}

	.floated label,
	input:autofill + label {
		top: 7px;
		transform: none;
		font-size: 0.72rem;
		font-weight: 600;
	}

	@media (prefers-reduced-motion: reduce) {
		label {
			transition: none;
		}
	}
</style>
