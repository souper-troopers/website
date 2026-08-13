<script lang="ts">
	import { cart } from "../lib/cart.svelte";

	let checkingOut = $state(false);
	let checkoutError = $state("");

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}

	async function checkout() {
		if (cart.items.length === 0 || checkingOut) return;
		checkingOut = true;
		checkoutError = "";
		try {
			const response = await fetch("/.netlify/functions/create-payfast-payment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: cart.items.map((i) => ({ ref: i.ref, qty: i.qty })),
				}),
			});
			if (!response.ok) throw new Error("Payment request failed");
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
		<h2>Your cart</h2>
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
					<div class="cart-line-controls">
						<input
							type="number"
							min="1"
							value={item.qty}
							class="cart-qty"
							onchange={(e) => cart.updateQty(item.key, +e.currentTarget.value)}
							aria-label={`Quantity for ${item.name}`}
						/>
						<button class="cart-remove" onclick={() => cart.remove(item.key)} aria-label={`Remove ${item.name}`}>Remove</button>
					</div>
				</li>
			{/each}
		</ul>

		<div class="cart-total">
			<span>Total</span>
			<strong>{rand(cart.total)}</strong>
		</div>

		<button class="checkout-btn" onclick={checkout} disabled={checkingOut}>
			{checkingOut ? "Redirecting to PayFast…" : "Checkout with PayFast →"}
		</button>
		{#if checkoutError}
			<p class="cart-error">{checkoutError}</p>
		{/if}
		<p class="cart-note">Collection is in person (66 Newmarket Street, Woodstock) or your own arranged courier.</p>
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

	.cart-drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.cart-drawer-header h2 {
		font-size: 1.15rem;
	}

	.cart-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: inherit;
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

	.cart-lines {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
	}

	.cart-line {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(36, 35, 43, 0.08);
	}

	.cart-line-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.cart-line-name {
		font-weight: 600;
		font-size: 0.92rem;
	}

	.cart-line-price {
		font-size: 0.8rem;
		color: rgba(36, 35, 43, 0.65);
	}

	.cart-line-controls {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.35rem;
	}

	.cart-qty {
		width: 3.2rem;
		font: inherit;
		padding: 0.25rem 0.4rem;
		border-radius: 8px;
		border: 1px solid rgba(36, 35, 43, 0.15);
		text-align: center;
	}

	.cart-remove {
		background: none;
		border: none;
		color: var(--st-red, #dd4b59);
		font-size: 0.78rem;
		cursor: pointer;
		padding: 0;
	}

	.cart-total {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 1.05rem;
		font-weight: 700;
	}

	.checkout-btn {
		width: 100%;
		background: var(--st-green, #4bbc63);
		color: var(--st-white, #fff);
		border: none;
		font: inherit;
		font-weight: 700;
		padding: 0.85rem;
		border-radius: 999px;
		cursor: pointer;
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
