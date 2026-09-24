<script lang="ts">
	import { cart } from "../lib/cart.svelte";

	let { id, categoryName, name, shortName, price, description, photoUrl, photoLqip, href, soldOut = false } = $props<{
		id: string;
		categoryName: string;
		name: string;
		/** What the card shows, when the page already names the range (see `shortProductName`). The
		 *  full name stays on the photo's alt text and in the cart. */
		shortName?: string;
		price: number;
		description?: string;
		photoUrl?: string;
		photoLqip?: string;
		/** Link through to the item's own page. Rendered into the static HTML, so it's also the crawl path to that page. */
		href?: string;
		soldOut?: boolean;
	}>();

	let added = $state(false);
	let photoLoaded = $state(false);

	function addToCart() {
		cart.add({ key: id, ref: { kind: "item", id }, categoryName, name, price });
		added = true;
		setTimeout(() => (added = false), 1500);
	}

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}
</script>

<div class="item-card">
	{#if photoUrl}
		<div class="item-card-img blur-up" style={photoLqip ? `background-image:url(${photoLqip})` : undefined}>
			{#if href}
				<a {href} tabindex="-1" aria-hidden="true">
					<img
						src={photoUrl}
						alt={name}
						width="500"
						height="500"
						loading="lazy"
						class:is-loaded={photoLoaded}
						onload={() => (photoLoaded = true)}
					/>
				</a>
			{:else}
				<img
					src={photoUrl}
					alt={name}
					width="500"
					height="500"
					loading="lazy"
					class:is-loaded={photoLoaded}
					onload={() => (photoLoaded = true)}
				/>
			{/if}
		</div>
	{/if}
	<h3>
		{#if href}
			<a {href}>{shortName ?? name}</a>
		{:else}
			{shortName ?? name}
		{/if}
	</h3>
	{#if description}
		<p class="item-card-desc">{description}</p>
	{/if}
	<div class="item-card-price">{rand(price)}</div>
	{#if soldOut}
		<span class="item-card-soldout">Sold out</span>
	{:else}
		<button class="btn btn-outline" onclick={addToCart} aria-label={added ? undefined : `Add ${name} to cart`}>
			{added ? "Added ✓" : "Add to cart"}
		</button>
	{/if}
</div>

<style>
	/* No card box (2026-09-24). Adrian, on the 21 September review: the grid read as cluttered, and
	   he preferred the old site's larger images without card borders; Hilton: "simple is sexy". The
	   white product photo is now the only shape, and the text sits straight on the page beneath it. */
	.item-card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.item-card-img {
		width: 100%;
		aspect-ratio: 1 / 1;
		margin-bottom: 0.5rem;
		border-radius: calc(var(--radius, 18px) - 6px);
		overflow: hidden;
		background-color: #fff;
	}

	.item-card-img img {
		transition: transform 0.3s ease;
	}

	.item-card-img:hover img {
		transform: scale(1.03);
	}

	@media (prefers-reduced-motion: reduce) {
		.item-card-img img {
			transition: none;
		}

		.item-card-img:hover img {
			transform: none;
		}
	}

	.item-card h3 {
		font-size: 1.1rem;
	}

	/* Underlined at rest, not only on hover: this is the crawl and click path into the item's own
	   page, and a hover-only affordance doesn't exist at all on touch. Colour is left to inherit so
	   the heading still reads as a heading; the underline is what says "link". */
	.item-card h3 a {
		color: inherit;
	}

	.item-card h3 a:hover {
		color: var(--st-teal-dark, #148294);
	}

	.item-card-img a {
		display: block;
		height: 100%;
	}

	.item-card-soldout {
		margin-top: auto;
		align-self: flex-start;
		padding: 0.5rem 0.9rem;
		border-radius: 999px;
		background: rgba(36, 35, 43, 0.08);
		color: rgba(36, 35, 43, 0.65);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.item-card-desc {
		font-size: 0.85rem;
		color: rgba(36, 35, 43, 0.65);
	}

	/* Ink, not teal-dark: the teal family is reserved for things you can act on, and a bold teal
	   price sitting directly under the product-name link read as the clickable one of the two. */
	.item-card-price {
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--st-ink, #24232b);
	}

	/* An ink outline, not the teal fill: nine identical teal pills were most of the clutter, and the
	   header's Donate / Shop stays the one filled control. Smaller than a standard .btn. No `border`
	   override here - .btn's border is what the outline recolours (see "The button system"). */
	.item-card button {
		margin-top: auto;
		align-self: flex-start;
		padding: 0.45rem 1.1rem;
		font-size: 0.9rem;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.item-card button:hover {
		background: var(--st-ink, #24232b);
		color: #fff;
	}
</style>
