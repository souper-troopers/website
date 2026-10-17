<script lang="ts">
	import { cart } from "../lib/cart.svelte";
	import FloatingField from "./FloatingField.svelte";

	let checkingOut = $state(false);
	let checkoutError = $state("");
	// Who to contact about collection (13 October): sent to PayFast and kept with the order, since
	// PayFast only returns buyer details it was given. The form's `required` checks them first.
	let firstName = $state("");
	let lastName = $state("");
	let email = $state("");

	// The page behind stays put while the cart is open (17 October): it scrolled under the scrim,
	// which looked odd. The scrollbar's width is padded back so the page doesn't shift sideways on
	// systems whose scrollbars take space.
	$effect(() => {
		if (!cart.isOpen) return;
		const root = document.documentElement;
		const scrollbar = window.innerWidth - root.clientWidth;
		root.style.overflow = "hidden";
		if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
		return () => {
			root.style.overflow = "";
			root.style.paddingRight = "";
		};
	});

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}

	async function checkout(event: SubmitEvent) {
		event.preventDefault();
		if (cart.items.length === 0 || checkingOut) return;
		checkingOut = true;
		checkoutError = "";
		try {
			const response = await fetch("/.netlify/functions/create-payfast-payment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: cart.items.map((i) => ({ ref: i.ref, qty: i.qty })),
					buyer: { firstName, lastName, email },
				}),
			});
			if (!response.ok) {
				const { error } = await response.json().catch(() => ({ error: "" }));
				if (response.status === 400 && error) {
					checkoutError = error;
					checkingOut = false;
					return;
				}
				throw new Error("Payment request failed");
			}
			const { action, fields } = await response.json();

			const form = document.createElement("form");
			form.method = "POST";
			form.action = action;
			for (const [name, value] of Object.entries(fields)) {
				const input = document.createElement("input");
				input.type = "hidden";
				input.name = name;
				input.value = String(value);
				form.appendChild(input);
			}
			document.body.appendChild(form);
			form.submit();
		} catch {
			checkoutError = "Something went wrong starting checkout. Please try again, or email manager@soupertroopers.org.";
			checkingOut = false;
		}
	}
</script>

<button class="cart-toggle" onclick={() => cart.open()} aria-label={`Cart, ${cart.count} item${cart.count === 1 ? "" : "s"}`}>
	<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
		<path d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2m4 3l1.6 9.6a2 2 0 0 0 2 1.4h8.8a2 2 0 0 0 2-1.7L21 9H6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
		<circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
		<circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
	</svg>
	{#if cart.count > 0}
		<span class="cart-count">{cart.count}</span>
	{/if}
</button>

<!-- Always mounted so transform/visibility can transition — display/if-mount can't be animated.
     Same asymmetric visibility delay as the mobile nav in Layout.astro. -->
<div
	class="cart-scrim"
	class:is-open={cart.isOpen}
	onclick={() => cart.close()}
	role="presentation"
></div>
<aside
	class="cart-drawer"
	class:is-open={cart.isOpen}
	aria-label="Shopping cart"
	aria-hidden={!cart.isOpen}
	inert={!cart.isOpen}
>
	<div class="cart-drawer-header">
		<h2>Your cart{#if cart.count > 0}<span class="cart-drawer-count">{cart.count} item{cart.count === 1 ? "" : "s"}</span>{/if}</h2>
		<button class="cart-close" onclick={() => cart.close()} aria-label="Close cart">&times;</button>
	</div>

	{#if cart.items.length === 0}
		<div class="cart-empty">
			<span class="cart-empty-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="40" height="40">
					<path d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2m4 3l1.6 9.6a2 2 0 0 0 2 1.4h8.8a2 2 0 0 0 2-1.7L21 9H6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
					<circle cx="9.5" cy="20" r="1.2" fill="currentColor" />
					<circle cx="17.5" cy="20" r="1.2" fill="currentColor" />
				</svg>
			</span>
			<p class="cart-empty-title">Your cart is empty</p>
			<p class="cart-empty-text">African Worry Dolls, gift tags and Troopers Coffee, made by people the CAST programme has supported.</p>
			<a href="/shop" class="btn btn-purple cart-empty-link">Browse the shop</a>
		</div>
	{:else}
		<ul class="cart-lines">
			{#each cart.items as item (item.key)}
				<li class="cart-line">
					<span class="cart-line-name">{item.name}</span>
					<input
						type="number"
						min="1"
						value={item.qty}
						class="cart-qty"
						onchange={(e) => cart.updateQty(item.key, +e.currentTarget.value)}
						aria-label={`Quantity for ${item.name}`}
					/>
					<span class="cart-line-price">{rand(item.price)} each</span>
					<span class="cart-line-subtotal">{rand(item.price * item.qty)}</span>
					<button class="cart-remove" onclick={() => cart.remove(item.key)} aria-label={`Remove ${item.name}`}>
						<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
							<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</button>
				</li>
			{/each}
		</ul>

		<!-- Pinned to the foot of the drawer (17 October, the user): the list above scrolls, so the
		     total and checkout stay in view however many items there are. -->
		<div class="cart-footer">
		<div class="cart-total">
			<span>Total</span>
			<strong>{rand(cart.total)}</strong>
		</div>

		<form class="checkout-form" onsubmit={checkout}>
			<p class="checkout-intro">Your details, so we can arrange collection with you:</p>
			<div class="checkout-names">
				<FloatingField label="First name" bind:value={firstName} required autocomplete="given-name" maxlength={100} />
				<FloatingField label="Surname" bind:value={lastName} required autocomplete="family-name" maxlength={100} />
			</div>
			<FloatingField label="Email" type="email" bind:value={email} required autocomplete="email" maxlength={100} />
			<button class="checkout-btn" type="submit" disabled={checkingOut}>
				{checkingOut ? "Redirecting to PayFast…" : "Checkout with PayFast →"}
			</button>
		</form>
		{#if checkoutError}
			<p class="cart-error">{checkoutError}</p>
		{/if}
		<p class="cart-note">Collection is in person (66 Newmarket Street, Woodstock) or your own arranged courier.</p>
		</div>
	{/if}
</aside>

<style>
	.cart-toggle {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--st-white, #fff);
		cursor: pointer;
		padding: 0.4rem;
	}

	.cart-count {
		position: absolute;
		top: -2px;
		right: -2px;
		background: var(--st-teal, #1babbe);
		color: var(--st-white, #fff);
		font-size: 0.68rem;
		font-weight: 700;
		line-height: 1;
		min-width: 16px;
		height: 16px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 3px;
	}

	.cart-scrim {
		position: fixed;
		inset: 0;
		background: rgba(24, 23, 31, 0.45);
		z-index: 200;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.25s ease, visibility 0s linear 0.25s;
	}

	.cart-scrim.is-open {
		opacity: 1;
		visibility: visible;
		transition: opacity 0.25s ease, visibility 0s linear 0s;
	}

	.cart-drawer {
		--line-pad: 0.9rem;
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(380px, 100vw);
		background: var(--st-white, #fff);
		color: var(--st-ink, #24232b);
		z-index: 201;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		/* 0.75rem a side (was 1.5rem; 17 October): the drawer is narrow, so the content gets the room. */
		padding: 0.75rem;
		box-shadow: -12px 0 30px rgba(0, 0, 0, 0.15);
		overflow-x: hidden;
		overflow-y: auto;
		transform: translateX(100%);
		visibility: hidden;
		transition: transform 0.25s ease, visibility 0s linear 0.25s;
	}

	.cart-drawer.is-open {
		transform: translateX(0);
		visibility: visible;
		transition: transform 0.25s ease, visibility 0s linear 0s;
	}

	@media (prefers-reduced-motion: reduce) {
		.cart-scrim,
		.cart-drawer {
			transition: none;
		}
	}

	/* An ink band across the top, like the site's own header, so the panel's title reads as its
	   frame rather than as one more line of content (17 October). Full bleed: it cancels the
	   drawer's padding. Same height as the site header, so the two line up on a phone. */
	.cart-drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: 0 0 auto;
		min-height: var(--header-height, 64px);
		margin: -0.75rem -0.75rem 0;
		padding: 0 0.5rem 0 0.75rem;
		background: var(--st-ink, #24232b);
		color: var(--st-white, #fff);
	}

	.cart-drawer-header h2 {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		font-size: 1.25rem;
	}

	.cart-drawer-count {
		font-size: 0.85rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.75);
	}

	.cart-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: none;
		border: none;
		border-radius: 50%;
		font-size: 1.6rem;
		line-height: 1;
		cursor: pointer;
		color: inherit;
	}

	.cart-close:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	/* Centred in the drawer's height (17 October): it used to sit at the top with the rest of the
	   panel empty below. The icon in a soft circle, a title, one line on what the shop is, and the
	   shop's own purple button. */
	.cart-empty {
		flex: 1 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem 1rem 4rem;
		gap: 0.75rem;
	}

	.cart-empty-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 88px;
		height: 88px;
		margin-bottom: 0.5rem;
		border-radius: 50%;
		background: #f3eef7;
		color: var(--hub-purple, #8156a4);
	}

	.cart-empty-title {
		font-size: 1.2rem;
		font-weight: 700;
	}

	.cart-empty-text {
		max-width: 26ch;
		font-size: 0.9rem;
		color: rgba(36, 35, 43, 0.7);
	}

	.cart-empty-link {
		margin-top: 0.75rem;
	}

	/* The list takes the drawer's spare height and scrolls inside it. Its floor (120px) means that
	   on a very short screen the drawer as a whole scrolls instead (its own overflow-y), rather
	   than the list shrinking to nothing. The small padding keeps focus rings from being clipped; the
	   1rem at its foot is inside the scroll, so the last box clears the divider only at the end. */
	/* Extra room top and right (12px, the drawer's own padding) for each box's corner bin, which
	   hangs half outside the box; the right margin takes the list out to the drawer's edge so the
	   boxes keep the full content width. */
	.cart-lines {
		list-style: none;
		margin: 0 -12px 0 -4px;
		padding: 12px 12px 1rem 4px;
		display: grid;
		align-content: start;
		gap: 1rem;
		flex: 1 1 auto;
		min-height: 120px;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	/* margin-top cancels the drawer's 1rem gap, so the divider sits flush on the scrolling list. */
	.cart-footer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: -1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(36, 35, 43, 0.12);
	}

	.cart-footer > p {
		margin: 0;
	}

	/* Each item in its own soft box (17 October). Two rows: the name beside the quantity, then the
	   unit price beside the line total, on one baseline. The line total's right edge lines up with
	   the Total figure below, which is inset by the same padding. The bin is a small circle hung on
	   the box's top-right corner. */
	.cart-line {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		column-gap: 0.75rem;
		row-gap: 0.35rem;
		padding: 0.75rem var(--line-pad);
		background: #f7f6f3;
		border: 1px solid rgba(36, 35, 43, 0.08);
		border-radius: 12px;
	}

	.cart-line-name {
		font-weight: 600;
		font-size: 0.92rem;
	}

	.cart-line-price,
	.cart-line-subtotal {
		align-self: baseline;
		font-size: 0.8rem;
	}

	.cart-line-price {
		color: rgba(36, 35, 43, 0.7);
	}

	.cart-line-subtotal {
		justify-self: end;
		font-weight: 700;
	}

	.cart-qty {
		justify-self: end;
		width: 3.2rem;
		font: inherit;
		padding: 0.25rem 0.4rem;
		border-radius: 8px;
		border: 1px solid rgba(36, 35, 43, 0.2);
		background: var(--st-white, #fff);
		text-align: center;
	}

	/* 24px - the WCAG 2.2 minimum target - centred on the corner. White, so it reads as sitting on
	   the box rather than in it; muted ink at rest, red on hover and focus. */
	.cart-remove {
		position: absolute;
		top: -12px;
		right: -12px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: var(--st-white, #fff);
		border: 1px solid rgba(36, 35, 43, 0.15);
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
		color: rgba(36, 35, 43, 0.7);
		cursor: pointer;
	}

	.cart-remove:hover,
	.cart-remove:focus-visible {
		color: var(--st-red, #dd4b59);
		border-color: currentColor;
	}

	/* Inset by the item boxes' padding, so "Total" lines up with the names and its figure with the
	   line totals. A divider beneath separates it from the form. */
	.cart-total {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0 calc(var(--line-pad) + 1px) 1rem;
		border-bottom: 1px solid rgba(36, 35, 43, 0.12);
		font-size: 1.05rem;
		font-weight: 700;
	}

	/* 0.85rem between rows: a floated label (FloatingField) stands ~6px above its field's border. */
	.checkout-form {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.checkout-intro {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(36, 35, 43, 0.75);
	}

	.checkout-names {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 0.6rem;
	}

	.checkout-btn {
		width: 100%;
		margin-top: 0.4rem;
		/* Hub purple, like Add to cart and Order this (Shan's shop colour, 8 October): white on it is
		   5.53:1, where the old green was 2.42:1. */
		background: var(--hub-purple, #8156a4);
		color: var(--st-white, #fff);
		border: none;
		font: inherit;
		font-weight: 700;
		padding: 0.85rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.checkout-btn:hover:not(:disabled) {
		background: var(--hub-purple-dark, #6a4589);
	}

	.checkout-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.cart-error {
		color: var(--st-red, #dd4b59);
		font-size: 0.85rem;
	}

	.cart-note {
		font-size: 0.78rem;
		color: rgba(36, 35, 43, 0.65);
	}
</style>
