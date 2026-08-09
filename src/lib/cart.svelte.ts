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
				if (typeof localStorage !== "undefined") {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
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
