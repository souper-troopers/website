<script lang="ts">
	import { cart } from "../lib/cart.svelte";

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
			<svg viewBox="0 0 24 24" width="64" height="64" aria-hidden="true" class="cart-empty-icon">
				<path d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2m4 3l1.6 9.6a2 2 0 0 0 2 1.4h8.8a2 2 0 0 0 2-1.7L21 9H6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				<circle cx="9.5" cy="20" r="1.2" fill="currentColor" />
				<circle cx="17.5" cy="20" r="1.2" fill="currentColor" />
			</svg>
			<p class="cart-empty-text">Your cart is empty.</p>
			<a href="/shop" class="cart-empty-link">Browse the shop &rarr;</a>
		</div>
	{:else}
		<ul class="cart-lines">
			{#each cart.items as item (item.key)}
				<li class="cart-line">
					<div class="cart-line-info">
						<span class="cart-line-name">{item.name}</span>
						<span class="cart-line-price">{rand(item.price)} each</span>
					</div>
					<div class="cart-line-qty">
						<input
							type="number"
							min="1"
							value={item.qty}
							class="cart-qty"
							onchange={(e) => cart.updateQty(item.key, +e.currentTarget.value)}
							aria-label={`Quantity for ${item.name}`}
						/>
						<span class="cart-line-subtotal">{rand(item.price * item.qty)}</span>
					</div>
					<button class="cart-remove" onclick={() => cart.remove(item.key)} aria-label={`Remove ${item.name}`}>
						<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
							<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
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
				<label>
					First name
					<input type="text" bind:value={firstName} required autocomplete="given-name" maxlength="100" />
				</label>
				<label>
					Surname
					<input type="text" bind:value={lastName} required autocomplete="family-name" maxlength="100" />
				</label>
			</div>
			<label>
				Email
				<input type="email" bind:value={email} required autocomplete="email" maxlength="100" />
			</label>
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
		padding: 1.5rem;
		box-shadow: -12px 0 30px rgba(0, 0, 0, 0.15);
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
		margin: -1.5rem -1.5rem 0;
		padding: 0 0.75rem 0 1.5rem;
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

	.cart-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 3rem 1rem 2.5rem;
		gap: 0.6rem;
	}

	/* The one ink alpha deliberately left below 0.65 (the AA floor for muted text on every
	   background this site uses — see "Colour is an affordance" in AGENTS.md). This is a purely
	   decorative empty-state glyph, not text, and .cart-empty-text right below states the same
	   thing in words, so it carries no information of its own. Don't "fix" it to 0.65. */
	.cart-empty-icon {
		color: rgba(36, 35, 43, 0.18);
	}

	.cart-empty-text {
		color: rgba(36, 35, 43, 0.65);
	}

	/* Underlined at rest rather than on hover only — colour was its sole affordance. */
	.cart-empty-link {
		color: var(--st-teal-dark, #148294);
		font-weight: 600;
	}

	/* The list takes the drawer's spare height and scrolls inside it. Its floor (120px) means that
	   on a very short screen the drawer as a whole scrolls instead (its own overflow-y), rather
	   than the list shrinking to nothing. The small padding keeps focus rings from being clipped; the
	   1rem at its foot is inside the scroll, so the last box clears the divider only at the end. */
	.cart-lines {
		list-style: none;
		margin: 0 -4px;
		padding: 4px 4px 1rem;
		display: grid;
		align-content: start;
		gap: 0.6rem;
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

	/* Each item in its own soft box (17 October): name and unit price on the left, quantity with
	   the line total beneath it, and a bin on the right. */
	.cart-line {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: start;
		gap: 0.75rem;
		padding: 0.75rem 0.5rem 0.75rem 0.9rem;
		background: #f7f6f3;
		border: 1px solid rgba(36, 35, 43, 0.08);
		border-radius: 12px;
	}

	.cart-line-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding-top: 0.15rem;
	}

	.cart-line-name {
		font-weight: 600;
		font-size: 0.92rem;
	}

	.cart-line-price {
		font-size: 0.8rem;
		color: rgba(36, 35, 43, 0.7);
	}

	.cart-line-qty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}

	.cart-qty {
		width: 3.2rem;
		font: inherit;
		padding: 0.25rem 0.4rem;
		border-radius: 8px;
		border: 1px solid rgba(36, 35, 43, 0.2);
		background: var(--st-white, #fff);
		text-align: center;
	}

	.cart-line-subtotal {
		font-size: 0.8rem;
		font-weight: 700;
	}

	/* A bin rather than the word: muted ink at rest (8.6:1 on the box), red on hover and focus. */
	.cart-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: none;
		border: none;
		border-radius: 8px;
		color: rgba(36, 35, 43, 0.7);
		cursor: pointer;
		padding: 0;
	}

	.cart-remove:hover,
	.cart-remove:focus-visible {
		color: var(--st-red, #dd4b59);
		background: rgba(221, 75, 89, 0.1);
	}

	.cart-total {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 1.05rem;
		font-weight: 700;
	}

	.checkout-form {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
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

	.checkout-form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.checkout-form input {
		box-sizing: border-box;
		width: 100%;
		height: 38px;
		padding: 0 0.6rem;
		border: 1px solid rgba(36, 35, 43, 0.35);
		border-radius: 8px;
		font: inherit;
		font-weight: 400;
		background: #fff;
		color: var(--st-ink);
	}

	.checkout-btn {
		width: 100%;
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
