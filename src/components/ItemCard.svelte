<script lang="ts">
	import { cart } from "../lib/cart.svelte";

	let { id, categoryName, name, price, description, photoUrl } = $props<{
		id: string;
		categoryName: string;
		name: string;
		price: number;
		description?: string;
		photoUrl?: string;
	}>();

	let added = $state(false);

	function addToCart() {
		cart.add({ key: id, ref: { kind: "item", id }, categoryName, name, price });
		added = true;
		setTimeout(() => (added = false), 1500);
	}

	function rand(n: number) {
		return "R" + n.toLocaleString("en-ZA");
	}
</script>

<div class="card item-card">
	{#if photoUrl}
		<img src={photoUrl} alt={name} width="500" height="500" loading="lazy" class="item-card-img" />
	{/if}
	<h3>{name}</h3>
	{#if description}
		<p class="item-card-desc">{description}</p>
	{/if}
	<div class="item-card-price">{rand(price)}</div>
	<button class="btn btn-primary" onclick={addToCart}>
		{added ? "Added ✓" : "Add to cart"}
	</button>
</div>

<style>
	.item-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.item-card-img {
		width: 100%;
		aspect-ratio: 1 / 1;
		object-fit: cover;
		border-radius: calc(var(--radius, 18px) - 6px);
	}

	.item-card h3 {
		font-size: 1.05rem;
	}

	.item-card-desc {
		font-size: 0.85rem;
		color: rgba(36, 35, 43, 0.65);
	}

	.item-card-price {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--st-teal-dark, #148294);
	}

	.item-card button {
		margin-top: auto;
		border: none;
		cursor: pointer;
		font: inherit;
	}
</style>
