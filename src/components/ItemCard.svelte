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

	// The card's colour is the photo's own backdrop (read at build time), so the card and the photo
	// are one surface: white for the dolls, the grey sweep for the gift tags.
	const cardColour = $derived(backdrop ?? "#ffffff");

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}
</script>

<!-- A product card (25 September): the price, the photo on its own backdrop, and the name with an
     arrow on the site's .card-cta wedge overlapping the photo's foot. The card takes the
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
	<!-- The name is the footer label, in place of "View" (25 September): it says where the link goes. -->
	<div class="card-cta-label item-card-view">
		<h3>
			{#if shortName && shortName !== name}
				<span class="visually-hidden">{name}</span><span aria-hidden="true">{shortName}</span>
			{:else}
				{name}
			{/if}
		</h3>
		{#if href}
			<svg class="card-cta-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
				<path d="M4 12h15M13 6l6 6-6 6" />
			</svg>
		{/if}
	</div>
</svelte:element>

<style>
	/* Doubled with .card: the <=700px `.card { padding }` rule would otherwise inset the photo.
	   Isolated so the photo's negative z-index stays inside the card. */
	.card.item-card {
		gap: 0;
		padding: 0;
		align-items: stretch;
		isolation: isolate;
		background: var(--card-colour, #fff);
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

	/* The name and arrow sit over the photo's foot, on the wedge. A long name wraps on a phone, so
	   the arrow stays beside its last line and the text keeps its right alignment. */
	.item-card-view {
		align-items: flex-end;
		margin: calc(-1 * var(--space-6, 1.5rem)) var(--space-5, 1.25rem) var(--space-4, 1rem);
		text-align: right;
	}

	.item-card-view .card-cta-arrow {
		flex-shrink: 0;
		margin-bottom: 0.2em;
	}

	.item-card-view h3 {
		text-wrap: balance;
	}

	/* Narrow cards (two across on a phone, ~165px): smaller type and less side margin, so "Hans
	   Moolman (pack of 3)" takes two lines rather than three. */
	.card.item-card {
		container-type: inline-size;
	}

	@container (max-width: 299px) {
		.item-card-view {
			margin-left: var(--space-3, 0.75rem);
			margin-right: var(--space-3, 0.75rem);
		}

		.item-card .item-card-view h3 {
			font-size: 0.95rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.item-card-photo img {
			transition: none;
		}

		a.item-card:hover .item-card-photo img {
			transform: none;
		}
	}

	/* The price, as a white pill at the top of the card. Ink and bold: a static figure, not a control, so
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
		font-size: 1.05rem;
		line-height: 1.3;
		color: var(--st-ink, #24232b);
	}

	.item-card-desc {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(36, 35, 43, 0.65);
	}
</style>
