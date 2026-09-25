<script lang="ts">
	let { name, shortName, price, description, photoUrl, photoLqip, href, soldOut = false } = $props<{
		/** Kept for the callers, which still pass it; the grid no longer adds to the cart itself. */
		id?: string;
		categoryName?: string;
		name: string;
		/** What the card shows, when the page already names the range (see `shortProductName`). The
		 *  full name is still the link's accessible name (visually hidden) and stays in the cart. */
		shortName?: string;
		price: number;
		description?: string;
		photoUrl?: string;
		photoLqip?: string;
		/** The item's own page. The whole tile links there - rendered into the static HTML, so it is
		 *  also the crawl path to that page. */
		href?: string;
		soldOut?: boolean;
	}>();

	let photoLoaded = $state(false);

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}
</script>

<!-- One link per tile since 25 September: photo, name and price all go to the product page, and
     Add to cart lives there only. The photo's alt is empty because the name is right below it, in
     the same link - otherwise the link reads the product's name twice. -->
<svelte:element this={href ? "a" : "div"} {href} class="item-card">
	{#if photoUrl}
		<div class="item-card-img blur-up" style={photoLqip ? `background-image:url(${photoLqip})` : undefined}>
			<img
				src={photoUrl}
				alt=""
				width="500"
				height="500"
				loading="lazy"
				class:is-loaded={photoLoaded}
				onload={() => (photoLoaded = true)}
			/>
		</div>
	{/if}
	<h3>
		{#if shortName && shortName !== name}
			<span class="visually-hidden">{name}</span><span class="item-card-name" aria-hidden="true">{shortName}</span>
		{:else}
			<span class="item-card-name">{name}</span>
		{/if}
	</h3>
	{#if description}
		<p class="item-card-desc">{description}</p>
	{/if}
	<div class="item-card-price">{rand(price)}</div>
	{#if soldOut}
		<span class="item-card-soldout">Sold out</span>
	{/if}
</svelte:element>

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

	@media (prefers-reduced-motion: reduce) {
		.item-card-img img {
			transition: none;
		}

		a.item-card:hover .item-card-img img {
			transform: none;
		}
	}

	.item-card h3 {
		font-size: 1.1rem;
	}

	/* The whole tile is the link. Text keeps the page's ink; the name is underlined at rest, not
	   only on hover - hover doesn't exist on touch, and the underline is what says "link" (see
	   "Colour is an affordance"). */
	a.item-card {
		color: inherit;
		text-decoration: none;
		border-radius: calc(var(--radius, 18px) - 6px);
	}

	a.item-card .item-card-name {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	a.item-card:hover .item-card-name {
		color: var(--st-teal-dark, #148294);
	}

	a.item-card:hover .item-card-img img {
		transform: scale(1.03);
	}

	a.item-card:focus-visible {
		outline: 3px solid var(--st-teal, #1babbe);
		outline-offset: 4px;
	}

	.item-card-soldout {
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

</style>
