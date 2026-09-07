export type CartRef = { kind: "item"; id: string } | { kind: "attribute"; categorySlug: string; variantKey: string };

export interface CartLine {
	key: string;
	ref: CartRef;
	categoryName: string;
	name: string;
	price: number;
	qty: number;
}

const STORAGE_KEY = "souper-troopers-cart";

function loadInitial(): CartLine[] {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

class CartStore {
	items = $state<CartLine[]>(loadInitial());
	isOpen = $state(false);

	count = $derived(this.items.reduce((sum, item) => sum + item.qty, 0));
	total = $derived(this.items.reduce((sum, item) => sum + item.price * item.qty, 0));

	constructor() {
		$effect.root(() => {
			$effect(() => {
				/**
				 * ⚠ The write must not be allowed to throw. `typeof localStorage !== "undefined"` only
				 * proves the API exists, not that it works: Safari in private browsing, and any browser
				 * set to block site data, expose `localStorage` and then throw on `setItem`. Verified
				 * against WebKit with `setItem` stubbed to throw - the page still rendered, but the
				 * error escaped this effect and broke the cart's reactivity, so adding an item stopped
				 * updating the count.
				 *
				 * Failing to persist is the acceptable outcome: the cart still works for the session,
				 * it just does not survive a reload. The read at `loadInitial` has been guarded since
				 * it was written; this is the other half.
				 */
				const snapshot = JSON.stringify(this.items);
				try {
					localStorage.setItem(STORAGE_KEY, snapshot);
				} catch {
					// Storage unavailable or full - the cart stays in memory for this session.
				}
			});
		});
	}

	add(line: Omit<CartLine, "qty">, qty = 1) {
		const existing = this.items.find((i) => i.key === line.key);
		if (existing) {
			existing.qty += qty;
		} else {
			this.items.push({ ...line, qty });
		}
		this.isOpen = true;
	}

	updateQty(key: string, qty: number) {
		if (qty <= 0) {
			this.remove(key);
			return;
		}
		const item = this.items.find((i) => i.key === key);
		if (item) item.qty = qty;
	}

	remove(key: string) {
		this.items = this.items.filter((i) => i.key !== key);
	}

	clear() {
		this.items = [];
	}

	open() {
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}
}

export const cart = new CartStore();
