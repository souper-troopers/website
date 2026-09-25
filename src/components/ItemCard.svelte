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
		/** The photo's own backdrop colour (read from its top edge at build time), for the room above
		 *  and below the photo. White when absent. */
		backdrop?: string;
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
	<!-- The photo's backdrop runs the full height of the card (25 September): the square photo sits
	     at the top of a box that fills the card, and the name and "View" sit over its foot, with no
	     white panel behind them. -->
	<div class="item-card-img" style={backdrop ? `--backdrop:${backdrop}` : undefined}>
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

	/* The backdrop box fills the whole card, under the wedge (z-index -2 against the wedge's -1,
	   inside the card's isolated stacking context) and under every word. White, so with the stage
	   wash below it reads as one surface with the photos' own near-white backdrops. */
	.item-card-img {
		position: absolute;
		inset: 0;
		z-index: -2;
		padding-top: var(--photo-top);
		background: var(--backdrop, #fff);
	}

	/* Breathing room above the photo (25 September): the card is taller and the product floats a
	   little lower on its backdrop. The body's padding follows it, so the name stays put. */
	.card.item-card {
		--photo-top: 16px;
	}

	.item-card-photo {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
	}

	.item-card-photo img {
		position: absolute;
		inset: 0;
		transition: transform 0.3s ease, opacity 0.4s ease;
	}

	/* The shop tiles' shared "stage" (see .category-tile-img::after in Layout.astro), now over the
	   whole backdrop box, so the photo and the space under it are one tone. */
	.item-card-img::after {
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

	/* The site's wedge, made opaque here: at 20% it let the doll's feet show through, so it read as
	   half over and half under the photo. These are the colours the tint produces over the stage
	   wash (#f3f2ef), so it looks the same, only solid. */
	a.card-cta.item-card::after {
		background: #dfecec;
	}

	a.card-cta.item-card:hover::after,
	a.card-cta.item-card:focus-visible::after {
		background: #d2e9ea;
	}

	@media (prefers-reduced-motion: reduce) {
		.item-card-photo img {
			transition: none;
		}

		a.item-card:hover .item-card-photo img {
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

	/* The top padding is a percentage of the card's width, so it tracks the square photo. On a card
	   300px or wider the text starts 44px above the photo's foot, so the name sits over the empty
	   backdrop beside the doll; on narrower cards (phones) the doll fills too much of the width and a
	   name ran over it, so there the name sits just under the photo - still on the backdrop, with no
	   white panel. Measured on real pixels: see AGENTS.md. */
	.card.item-card {
		container-type: inline-size;
	}

	.item-card-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--space-1, 0.25rem);
		padding: calc(100% + var(--photo-top) + var(--space-4, 1rem)) var(--space-5, 1.25rem) var(--space-6, 1.5rem);
	}

	@container (min-width: 300px) {
		.item-card-img,
		.item-card-body {
			--photo-top: 32px;
		}

		.item-card-body {
			padding-top: calc(100% + var(--photo-top) - 44px);
		}

		/* A soft fade into the backdrop across the photo's foot, under the name: without it "Christmas
		   Angel" ran over the angel's gold wings at ~3.2:1. Sits under the stage wash, so it lands on
		   the same tone as the backdrop below. */
		.item-card-photo::after {
			content: "";
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 72px;
			background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--backdrop, #fff) 85%, transparent));
			pointer-events: none;
		}
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
