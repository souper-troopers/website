<script lang="ts">
	import { cart } from "../lib/cart.svelte";

	let { id, categoryName, name, price } = $props<{
		id: string;
		categoryName: string;
		name: string;
		price: number;
	}>();

	let added = $state(false);

	function addToCart() {
		cart.add({ key: id, ref: { kind: "item", id }, categoryName, name, price });
		added = true;
		setTimeout(() => (added = false), 1500);
	}
</script>

<button class="btn btn-primary add-to-cart" onclick={addToCart}>
	{added ? "Added ✓" : "Add to cart"}
</button>

<style>
	.add-to-cart {
		cursor: pointer;
		font: inherit;
		font-size: 1.05rem;
		padding: 0.85rem 2rem;
	}
</style>
