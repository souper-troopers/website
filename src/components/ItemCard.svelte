<script lang="ts">
	let { name, shortName, price, description, photoUrl, photoLqip, backdrop, href, soldOut = false } = $props<{
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
		/** The photo's own backdrop colour (read from its top edge at build time), so the card around
		 *  the photo is the same tone. White when absent. */
		backdrop?: string;
		/** The item's own page. The whole card links there - rendered into the static HTML, so it is
		 *  also the crawl path to that page. */
		href?: string;
		soldOut?: boolean;
	}>();

	let photoLoaded = $state(false);

	// The card's colour: the photo's backdrop under the same stage wash (#f3f2ef, multiplied) that
	// sits over the photo, so the card and the photo's own backdrop are one surface.
	const cardColour = $derived.by(() => {
		const hex = /^#([0-9a-f]{6})$/i.exec(backdrop ?? "#ffffff")?.[1] ?? "ffffff";
		const wash = [0xf3, 0xf2, 0xef];
		return (
			"#" +
			[0, 2, 4]
				.map((i, c) => Math.round((parseInt(hex.slice(i, i + 2), 16) * wash[c]) / 255).toString(16).padStart(2, "0"))
				.join("")
		);
	});

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}
</script>

<!-- A product card (25 September): the name, then the price, then the photo on its own backdrop,
     with "View" on the site's .card-cta wedge overlapping the photo's foot. The card takes the
     photo's backdrop colour, so there is no white panel anywhere. The whole card is one link to the
     product page; Add to cart lives there only. The photo's alt is empty because the name is in the
     same link - otherwise the link reads the product's name twice. -->
<svelte:element
	this={href ? "a" : "div"}
	{href}
	class={href ? "card card-cta item-card" : "card item-card"}
	style={`--card-colour:${cardColour}`}
>
	<div class="item-card-head">
		<h3>
			{#if shortName && shortName !== name}
				<span class="visually-hidden">{name}</span><span aria-hidden="true">{shortName}</span>
			{:else}
				{name}
			{/if}
		</h3>
		{#if soldOut}
			<span class="item-card-pill is-soldout">Sold out</span>
		{:else}
			<span class="item-card-pill">{rand(price)}</span>
		{/if}
		{#if description}
			<p class="item-card-desc">{description}</p>
		{/if}
	</div>
	<div class="item-card-photo blur-up" style={photoLqip ? `background-image:url(${photoLqip})` : undefined}>
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
	</div>
	{#if href}
		<span class="card-cta-label item-card-view">
			View
			<svg class="card-cta-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
				<path d="M4 12h15M13 6l6 6-6 6" />
			</svg>
		</span>
	{/if}
</svelte:element>

<style>
	/* Doubled with .card: the <=700px `.card { padding }` rule would otherwise inset the photo.
	   Isolated so the photo's negative z-index stays inside the card. */
	.card.item-card {
		gap: 0;
		padding: 0;
		align-items: stretch;
		isolation: isolate;
		background: var(--card-colour, #f3f2ef);
	}

	.item-card-head {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2, 0.5rem);
		padding: var(--space-5, 1.25rem) var(--space-5, 1.25rem) var(--space-2, 0.5rem);
	}

	/* Under the wedge (z-index -2 against the wedge's -1), so the solid footer sits over the photo's
	   foot rather than half over and half under it. */
	.item-card-photo {
		position: relative;
		z-index: -2;
		width: 100%;
		aspect-ratio: 1 / 1;
	}

	.item-card-photo img {
		position: absolute;
		inset: 0;
		transition: transform 0.3s ease, opacity 0.4s ease;
	}

	/* The shop tiles' shared "stage" (see .category-tile-img::after in Layout.astro). The card's own
	   colour is the same wash applied to the photo's backdrop, so the two meet without a seam. */
	.item-card-photo::after {
		content: "";
		position: absolute;
		inset: 0;
		background: #f3f2ef;
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	a.item-card:hover .item-card-photo img {
		transform: scale(1.03);
	}

	/* The site's wedge, made opaque here and a shade darker than the tint elsewhere: at 20% the
	   dolls' feet showed through it. */
	a.card-cta.item-card::after {
		background: #d5e7e8;
	}

	a.card-cta.item-card:hover::after,
	a.card-cta.item-card:focus-visible::after {
		background: #c6e1e3;
	}

	/* "View" sits over the photo's foot, on the wedge. */
	.item-card-view {
		margin: calc(-1 * var(--space-6, 1.5rem)) var(--space-5, 1.25rem) var(--space-4, 1rem);
	}

	@media (prefers-reduced-motion: reduce) {
		.item-card-photo img {
			transition: none;
		}

		a.item-card:hover .item-card-photo img {
			transform: none;
		}
	}

	/* The price, as a white pill under the name. Ink and bold: a static figure, not a control, so
	   not teal. */
	.item-card-pill {
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
