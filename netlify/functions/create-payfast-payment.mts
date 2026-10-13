import { createClient } from "@sanity/client";
import { createHash, randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { ORDER_STORE, siteUrl as siteUrlFor, ascii, describeLines, type Buyer, type StoredOrder } from "./lib/shop-order.mts";

const sanityClient = createClient({
	projectId: "wqa0no5g",
	dataset: "production",
	apiVersion: "2026-08-08",
	useCdn: false,
});

interface CartRef {
	kind: "item" | "attribute";
	id?: string;
	categorySlug?: string;
	variantKey?: string;
}

interface IncomingLine {
	ref: CartRef;
	qty: number;
}

interface ResolvedLine {
	name: string;
	price: number;
	qty: number;
}

async function resolveLine(line: IncomingLine): Promise<ResolvedLine | null> {
	const qty = Math.max(1, Math.floor(Number(line.qty) || 1));

	if (line.ref.kind === "item" && line.ref.id) {
		const item = await sanityClient.fetch(`*[_type == "shopItem" && _id == $id][0]{name, price}`, {
			id: line.ref.id,
		});
		if (!item) return null;
		return { name: item.name, price: item.price, qty };
	}

	if (line.ref.kind === "attribute" && line.ref.categorySlug && line.ref.variantKey) {
		const category = await sanityClient.fetch(
			`*[_type == "productCategory" && slug.current == $slug][0]{name, attributeVariants}`,
			{ slug: line.ref.categorySlug }
		);
		const variant = category?.attributeVariants?.find((v: { _key: string }) => v._key === line.ref.variantKey);
		if (!variant) return null;
		return { name: `${category.name} — ${variant.label}`, price: variant.price, qty };
	}

	return null;
}

// PayFast's signature: concatenate fields in insertion order (not alphabetical),
// PHP-style urlencode (spaces as "+"), append the passphrase if one is set, then MD5.
function phpUrlEncode(value: string): string {
	// encodeURIComponent leaves !'()* unencoded, but PHP's urlencode() - which is what
	// PayFast's own systems use to sign requests - encodes them too. Without this, any
	// field containing e.g. a parenthesis (like "Gift Tag - Hans Moolman (pack of 3)")
	// produces a signature that won't match what PayFast expects.
	return encodeURIComponent(value)
		.replace(/%20/g, "+")
		.replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildSignature(fields: Record<string, string>, passphrase: string): string {
	const pairs = Object.entries(fields)
		.filter(([, value]) => value !== "" && value !== undefined && value !== null)
		.map(([key, value]) => `${key}=${phpUrlEncode(value)}`);
	let query = pairs.join("&");
	if (passphrase) {
		query += `&passphrase=${phpUrlEncode(passphrase)}`;
	}
	return createHash("md5").update(query).digest("hex");
}

export default async (request: Request) => {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	const merchantId = process.env.PAYFAST_MERCHANT_ID;
	const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
	const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
	const mode = process.env.PAYFAST_MODE ?? "sandbox";
	const siteUrl = siteUrlFor(request);

	if (!merchantId || !merchantKey) {
		return new Response(JSON.stringify({ error: "Payment processor is not configured." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	let body: { items?: IncomingLine[]; buyer?: Partial<Buyer> };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request body." }), { status: 400 });
	}

	const incoming = body.items ?? [];
	if (incoming.length === 0) {
		return new Response(JSON.stringify({ error: "Cart is empty." }), { status: 400 });
	}

	// Required: the Hub has to be able to reach the buyer to arrange collection.
	const clean = (value: unknown, max: number) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
	const buyer: Buyer = {
		firstName: clean(body.buyer?.firstName, 100),
		lastName: clean(body.buyer?.lastName, 100),
		email: clean(body.buyer?.email, 100),
	};
	if (!buyer.firstName || !buyer.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) {
		return new Response(JSON.stringify({ error: "Please add your name and email." }), { status: 400 });
	}

	const resolved = await Promise.all(incoming.map(resolveLine));
	if (resolved.some((line) => line === null)) {
		return new Response(JSON.stringify({ error: "One or more items in your cart are no longer available." }), {
			status: 400,
		});
	}

	const lines = resolved as ResolvedLine[];
	const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
	const itemName = ascii(
		lines.length === 1 && lines[0].qty === 1
			? lines[0].name
			: `Souper Troopers Shop order (${lines.reduce((n, line) => n + line.qty, 0)} items)`
	).slice(0, 100);
	const paymentId = randomUUID();

	// Field order matters for the signature — PayFast validates against the exact
	// order fields were concatenated in, so this order must match what's submitted below.
	const fields: Record<string, string> = {
		merchant_id: merchantId,
		merchant_key: merchantKey,
		return_url: `${siteUrl}/shop/order-confirmed?ref=${paymentId}`,
		cancel_url: `${siteUrl}/shop/order-cancelled`,
		notify_url: `${siteUrl}/.netlify/functions/payfast-itn`,
		// Buyer details, in PayFast's documented position (after notify_url, before m_payment_id).
		// PayFast pre-fills its page with them and returns them in the notification. ASCII, like
		// everything signed; the stored order keeps the name as typed.
		name_first: ascii(buyer.firstName),
		name_last: ascii(buyer.lastName),
		email_address: buyer.email,
		m_payment_id: paymentId,
		amount: total.toFixed(2),
		item_name: itemName,
		// What was bought, so PayFast's own dashboard and payment emails say more than "3 items".
		// PayFast caps it at 255 characters; the full list is in the stored order below.
		item_description: describeLines(lines, 255),
	};

	// Kept so the payment notification (payfast-itn) can say exactly what was ordered, and check
	// the amount PayFast reports against what we priced. Written before the buyer is sent to PayFast,
	// so it exists by the time PayFast notifies us.
	const order: StoredOrder = { lines, buyer, total: total.toFixed(2), createdAt: new Date().toISOString() };
	await getStore({ name: ORDER_STORE, consistency: "strong" }).setJSON(paymentId, order);

	// Blank fields are left out of the signature, so they mustn't be posted either (a name of only
	// non-ASCII letters comes out of ascii() empty).
	for (const key of Object.keys(fields)) if (!fields[key]) delete fields[key];

	const signature = buildSignature(fields, passphrase);

	const action =
		mode === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";

	return new Response(JSON.stringify({ action, fields: { ...fields, signature } }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
