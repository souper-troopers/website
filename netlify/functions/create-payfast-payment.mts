import { createClient } from "@sanity/client";
import { createHash, randomUUID } from "node:crypto";

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
	const siteUrl = process.env.URL ?? "https://souper-troopers.netlify.app";

	if (!merchantId || !merchantKey) {
		return new Response(JSON.stringify({ error: "Payment processor is not configured." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	let body: { items?: IncomingLine[] };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request body." }), { status: 400 });
	}

	const incoming = body.items ?? [];
	if (incoming.length === 0) {
		return new Response(JSON.stringify({ error: "Cart is empty." }), { status: 400 });
	}

	const resolved = await Promise.all(incoming.map(resolveLine));
	if (resolved.some((line) => line === null)) {
		return new Response(JSON.stringify({ error: "One or more items in your cart are no longer available." }), {
			status: 400,
		});
	}

	const lines = resolved as ResolvedLine[];
	const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
	const itemName =
		lines.length === 1 ? lines[0].name : `Souper Troopers Shop order (${lines.length} items)`;
	const paymentId = randomUUID();

	// Field order matters for the signature — PayFast validates against the exact
	// order fields were concatenated in, so this order must match what's submitted below.
	const fields: Record<string, string> = {
		merchant_id: merchantId,
		merchant_key: merchantKey,
		return_url: `${siteUrl}/shop/order-confirmed?ref=${paymentId}`,
		cancel_url: `${siteUrl}/shop/order-cancelled`,
		notify_url: `${siteUrl}/.netlify/functions/payfast-itn`,
		m_payment_id: paymentId,
		amount: total.toFixed(2),
		item_name: itemName,
	};

	const signature = buildSignature(fields, passphrase);

	const action =
		mode === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";

	return new Response(JSON.stringify({ action, fields: { ...fields, signature } }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
