<script lang="ts">
	import { cart } from "../lib/cart.svelte";

	let { categorySlug, categoryName, photoUrl, photoLqip, variants } = $props<{
		categorySlug: string;
		categoryName: string;
		photoUrl?: string;
		photoLqip?: string;
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
			name: `${categoryName} - ${selected.label}`,
			price: selected.price,
		});
		added = true;
		setTimeout(() => (added = false), 1500);
	}
</script>

<!-- The same one white box as an item's product page (26 September; this was a 700px card with a
     320px photo): the photo flush on the left at its own 4:3, the details on the right - price as the
     heading line, the option, Add to cart - and the collection note at the base. -->
<div class="attribute-product">
	{#if photoUrl}
		<div class="attribute-product-img blur-up" style={photoLqip ? `background-image:url(${photoLqip})` : undefined}>
			<img
				src={photoUrl}
				alt={categoryName}
				width="1100"
				height="619"
				loading="eager"
				fetchpriority="high"
			/>
		</div>
	{/if}

	<div class="attribute-product-body">
		<p class="attribute-product-price">{selected ? rand(selected.price) : ""}</p>

		<label class="attribute-field">
			Choose an option
			<select bind:value={selectedIndex}>
				{#each variants as variant, i}
					<option value={i}>{variant.label} - {rand(variant.price)}</option>
				{/each}
			</select>
		</label>

		<button class="btn btn-primary" onclick={addToCart} disabled={!selected}>
			{added ? "Added ✓" : "Add to cart"}
		</button>

		<p class="attribute-product-note">
			Every purchase funds Souper Troopers' work with people experiencing homelessness in Cape Town.
			Orders are collected in person or by a courier you arrange.
		</p>
	</div>
</div>

<style>
	/* Matches .product in shop/[category]/[item].astro - keep the two in step. Not the site's .card:
	   its phone padding rule would inset the photo. */
	.attribute-product {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: stretch;
		overflow: hidden;
		border-radius: var(--radius);
		background: var(--st-white);
		box-shadow: 0 0 0 1px rgba(36, 35, 43, 0.07), 0 14px 30px rgba(0, 0, 0, 0.05);
	}

	@media (max-width: 720px) {
		.attribute-product {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	/* A 4:3 box (the height of the details on a laptop) with the photo covering it. The coffee and
	   bracelet category photos are 16:9 (2134x1200) with the product centred, so the sides this trims
	   are backdrop only - checked at 1280, 900, 390 and 360. If the details ever run taller, the photo
	   grows with the row and trims a little more. */
	.attribute-product-img {
		position: relative;
		min-height: 100%;
		aspect-ratio: 4 / 3;
		background-color: #fff;
		background-size: cover;
	}

	.attribute-product-img img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.attribute-product-body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-5);
		padding: clamp(1.5rem, 3vw, 2.5rem);
	}

	/* Ink, not teal-dark - see .product-price in shop/[category]/[item].astro, which this matches. */
	.attribute-product-price {
		margin: 0;
		font-size: 1.9rem;
		font-weight: 800;
		line-height: 1.1;
		color: var(--st-ink, #24232b);
	}

	.attribute-field {
		display: grid;
		align-self: stretch;
		min-width: 0;
		max-width: 26rem;
		gap: 0.35rem;
		font-weight: 600;
		font-size: 0.9rem;
	}

	/* Width-bound: the longest option ("250g, Ground Espresso/Moka Pot - R145") otherwise sets the
	   select's width and pushed the card 3px past a 360px screen. */
	.attribute-field select {
		width: 100%;
		max-width: 100%;
		min-width: 0;
		font: inherit;
		padding: 0.6rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		background: white;
	}

	/* No border override: .btn's transparent border keeps every button one height (AGENTS.md). */
	.attribute-product-body button {
		cursor: pointer;
		font: inherit;
	}

	/* The product page's footnote, pushed to the base the same way. */
	.attribute-product-note {
		margin: auto 0 0;
		padding-top: var(--space-4);
		border-top: 1px solid rgba(36, 35, 43, 0.1);
		align-self: stretch;
		font-size: 0.85rem;
		color: rgba(36, 35, 43, 0.68);
		line-height: 1.6;
	}
</style>
