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
		/** The item's own page. The whole card links there - rendered into the static HTML, so it is
		 *  also the crawl path to that page. */
		href?: string;
		soldOut?: boolean;
	}>();

	let photoLoaded = $state(false);

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}
</script>

<!-- The site's white card with the .card-cta wedge since 25 September (reversing the cardless grid
     of 24 September - to be shown to Adrian on the 30th): photo edge to edge with the price as a pill
     over its top-left, the name beneath, "View" over the wedge. The whole card is one link to the
     product page; Add to cart lives there only. The photo's alt is empty because the name is in the
     same link - otherwise the link reads the product's name twice. -->
<svelte:element this={href ? "a" : "div"} {href} class={href ? "card card-cta item-card" : "card item-card"}>
	<div class="item-card-img blur-up" style={photoLqip ? `background-image:url(${photoLqip})` : undefined}>
		{#if photoUrl}
			<img
				src={photoUrl}
				alt=""
				width="500"
				height="500"
				loading="lazy"
				class:is-loaded={photoLoaded}
				onload={() => (photoLoaded = true)}
			/>
		{/if}
		{#if soldOut}
			<span class="item-card-pill is-soldout">Sold out</span>
		{:else}
			<span class="item-card-pill">{rand(price)}</span>
		{/if}
	</div>
	<div class="item-card-body">
		<h3>
			{#if shortName && shortName !== name}
				<span class="visually-hidden">{name}</span><span aria-hidden="true">{shortName}</span>
			{:else}
				{name}
			{/if}
		</h3>
		{#if description}
			<p class="item-card-desc">{description}</p>
		{/if}
		{#if href}
			<span class="card-cta-label">
				View
				<svg class="card-cta-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
					<path d="M4 12h15M13 6l6 6-6 6" />
				</svg>
			</span>
		{/if}
	</div>
</svelte:element>

<style>
	/* Doubled with .card: the <=700px `.card { padding }` rule would otherwise inset the photo. */
	.card.item-card {
		gap: 0;
		padding: 0;
		align-items: stretch;
	}

	.item-card-img {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		overflow: hidden;
	}

	.item-card-img img {
		position: absolute;
		inset: 0;
		transition: transform 0.3s ease, opacity 0.4s ease;
	}

	/* The shop tiles' shared "stage" (see .category-tile-img::after in Layout.astro): the product
	   shots are padded to square on white, which melted into the white card; the same warm grey wash,
	   multiplied, gives every photo one soft edge above the name. */
	.item-card-img::after {
		content: "";
		position: absolute;
		inset: 0;
		background: #f3f2ef;
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	a.item-card:hover .item-card-img img {
		transform: scale(1.03);
	}

	@media (prefers-reduced-motion: reduce) {
		.item-card-img img {
			transition: none;
		}

		a.item-card:hover .item-card-img img {
			transform: none;
		}
	}

	/* The price, as a white pill over the photo's top-left. Ink and bold: a static figure, not a
	   control, so not teal. Above the stage wash (z-index), so it stays pure white. */
	.item-card-pill {
		position: absolute;
		top: var(--space-3, 0.75rem);
		left: var(--space-3, 0.75rem);
		z-index: 1;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 2px 8px rgba(36, 35, 43, 0.14);
		color: var(--st-ink, #24232b);
		font-size: 0.95rem;
		font-weight: 700;
		line-height: 1.3;
	}

	/* Sold out replaces the price: muted ink on pale grey, so it reads as a state, not a price. */
	.item-card-pill.is-soldout {
		background: #eeedea;
		box-shadow: none;
		color: rgba(36, 35, 43, 0.78);
	}

	.item-card-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--space-1, 0.25rem);
		padding: var(--space-4, 1rem) var(--space-5, 1.25rem) var(--space-6, 1.5rem);
	}

	.item-card h3 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--st-ink, #24232b);
	}

	.item-card-desc {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(36, 35, 43, 0.65);
	}
</style>
