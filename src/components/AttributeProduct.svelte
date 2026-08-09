<script lang="ts">
	import { cart } from "../lib/cart.svelte";

	let { categorySlug, categoryName, photoUrl, variants } = $props<{
		categorySlug: string;
		categoryName: string;
		photoUrl?: string;
		variants: { _key: string; label: string; price: number }[];
	}>();

	let selectedIndex = $state(0);
	let added = $state(false);

	let selected = $derived(variants[selectedIndex]);

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}

	function addToCart() {
		if (!selected) return;
		cart.add({
			key: `${categorySlug}::${selected._key}`,
			ref: { kind: "attribute", categorySlug, variantKey: selected._key },
			categoryName,
			name: `${categoryName} — ${selected.label}`,
			price: selected.price,
		});
		added = true;
		setTimeout(() => (added = false), 1500);
	}
</script>

<div class="card attribute-product">
	{#if photoUrl}
		<img src={photoUrl} alt={categoryName} width="700" height="700" loading="lazy" class="attribute-product-img" />
	{/if}

	<div class="attribute-product-body">
		<label class="attribute-field">
			Choose an option
			<select bind:value={selectedIndex}>
				{#each variants as variant, i}
					<option value={i}>{variant.label} — {rand(variant.price)}</option>
				{/each}
			</select>
		</label>

		<div class="attribute-product-price">{selected ? rand(selected.price) : ""}</div>

		<button class="btn btn-primary" onclick={addToCart} disabled={!selected}>
			{added ? "Added ✓" : "Add to cart"}
		</button>
	</div>
</div>

<style>
	.attribute-product {
		display: grid;
		grid-template-columns: minmax(0, 320px) 1fr;
		gap: 2rem;
		align-items: start;
		max-width: 700px;
	}

	@media (max-width: 640px) {
		.attribute-product {
			grid-template-columns: 1fr;
		}
	}

	.attribute-product-img {
		width: 100%;
		aspect-ratio: 1 / 1;
		object-fit: cover;
		border-radius: calc(var(--radius, 18px) - 6px);
	}

	.attribute-product-body {
		display: grid;
		gap: 1rem;
	}

	.attribute-field {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.attribute-field select {
		font: inherit;
		padding: 0.6rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		background: white;
	}

	.attribute-product-price {
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--st-teal-dark, #148294);
	}

	.attribute-product-body button {
		width: fit-content;
		border: none;
		cursor: pointer;
		font: inherit;
	}
</style>
