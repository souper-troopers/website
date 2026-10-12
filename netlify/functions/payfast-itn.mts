import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { ORDER_STORE, siteUrl as siteUrlFor, describeLines, type StoredOrder } from "./lib/shop-order.mts";

/**
 * Tells the Hub about a paid order by submitting the hidden `shop-order` Netlify Form (declared in
 * src/pages/shop/order-confirmed.astro, where Netlify finds it at deploy). Netlify then emails it
 * to that form's notification address - set in the dashboard, like the contact form's - and keeps
 * it under Forms. Before this (October 2026) a paid order only reached the function logs, and
 * PayFast's own emails said "Shop order (3 items)" with no list.
 */
async function notifyHub(fields: Record<string, string>, order: StoredOrder | null): Promise<boolean> {
	const siteUrl = siteUrlFor();
	const amountOk = !order || Number(order.total) === Number(fields.amount_gross);
	const items = order
		? order.lines.map((line) => `${line.qty} x ${line.name} - R${(line.price * line.qty).toFixed(2)}`).join("\n")
		: `${fields.item_name}\n${fields.item_description ?? ""}`.trim();
	const body = new URLSearchParams({
		"form-name": "shop-order",
		"buyer-name": [fields.name_first, fields.name_last].filter(Boolean).join(" "),
		"buyer-email": fields.email_address ?? "",
		items,
		"amount-paid": `R${fields.amount_gross}`,
		check: amountOk
			? "Paid in full."
			: `WARNING: PayFast reports R${fields.amount_gross} but the basket came to R${order?.total}. Check the PayFast dashboard before sending anything.`,
		"payfast-reference": fields.pf_payment_id ?? "",
		"order-reference": fields.m_payment_id ?? "",
		"next-step": "Email the buyer to arrange collection from the Hub or their own courier.",
	});
	try {
		const response = await fetch(`${siteUrl}/`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: body.toString(),
		});
		return response.ok;
	} catch {
		return false;
	}
}

function phpUrlEncode(value: string): string {
	// encodeURIComponent leaves !'()* unencoded, but PHP's urlencode() - which is what
	// PayFast's own systems use to sign requests - encodes them too. Without this, any
	// field containing e.g. a parenthesis (like "Gift Tag - Hans Moolman (pack of 3)")
	// produces a signature that won't match PayFast's.
	return encodeURIComponent(value)
		.replace(/%20/g, "+")
		.replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

// PayFast signs the ITN over the exact raw body they sent, byte for byte - including
// empty fields (custom_str1=, name_first=, etc.) which they always include. Re-parsing
// the body and reconstructing it (as create-payfast-payment.mts does for the *outgoing*
// request, where we choose what to include) silently drops those empty fields and breaks
// the signature. The fix: strip only the "signature=..." pair from the raw body itself,
// don't touch anything else, and hash that directly. Confirmed against a real ITN payload
// before this fix shipped.
function verifySignature(
	rawBody: string,
	receivedSignature: string | undefined,
	passphrase: string
): { ok: boolean; query: string; expected: string } {
	let query = rawBody
		.split("&")
		.filter((pair) => !pair.startsWith("signature="))
		.join("&");
	if (passphrase) query += `&passphrase=${phpUrlEncode(passphrase)}`;

	const expected = createHash("md5").update(query).digest("hex");
	return { ok: !!receivedSignature && expected === receivedSignature, query, expected };
}

// PayFast's own recommended step: post the raw notification back to them so they can
// confirm it genuinely came from their system, not just that the signature matches
// (a signature match alone doesn't rule out a replay of a previously-valid payload).
async function confirmWithPayfast(rawBody: string, mode: string): Promise<boolean> {
	const host = mode === "live" ? "www.payfast.co.za" : "sandbox.payfast.co.za";
	try {
		const response = await fetch(`https://${host}/eng/query/validate`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: rawBody,
		});
		const text = await response.text();
		return text.trim() === "VALID";
	} catch {
		return false;
	}
}

export default async (request: Request) => {
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
	const mode = process.env.PAYFAST_MODE ?? "sandbox";

	const rawBody = await request.text();
	const params = new URLSearchParams(rawBody);
	const fields: Record<string, string> = {};
	for (const [key, value] of params) fields[key] = value;

	const verification = verifySignature(rawBody, fields.signature, passphrase);
	const payfastConfirmed = verification.ok && (await confirmWithPayfast(rawBody, mode));

	if (!verification.ok || !payfastConfirmed) {
		console.error("PayFast ITN rejected", {
			signatureOk: verification.ok,
			payfastConfirmed,
			paymentId: fields.m_payment_id,
			rawBody,
			queryWeComputed: verification.query,
			signatureWeComputed: verification.expected,
			signaturePayfastSent: fields.signature,
			passphraseConfigured: passphrase.length > 0,
		});
		return new Response("Invalid notification", { status: 400 });
	}

	if (fields.payment_status === "COMPLETE") {
		const store = getStore({ name: ORDER_STORE, consistency: "strong" });
		const order = fields.m_payment_id
			? ((await store.get(fields.m_payment_id, { type: "json" })) as StoredOrder | null)
			: null;

		console.log("PayFast payment confirmed", {
			paymentId: fields.m_payment_id,
			amount: fields.amount_gross,
			items: order ? describeLines(order.lines) : fields.item_name,
			orderFound: !!order,
		});

		// PayFast can repeat a notification; only the first one emails the Hub.
		if (order?.notifiedAt) return new Response("OK", { status: 200 });

		if (!(await notifyHub(fields, order))) {
			// A non-200 makes PayFast send the notification again later, which retries the email.
			console.error("Order email failed", { paymentId: fields.m_payment_id });
			return new Response("Notification failed", { status: 500 });
		}

		if (order && fields.m_payment_id) {
			await store.setJSON(fields.m_payment_id, { ...order, notifiedAt: new Date().toISOString() });
		}
	} else {
		console.log("PayFast ITN received with non-complete status", {
			paymentId: fields.m_payment_id,
			status: fields.payment_status,
		});
	}

	return new Response("OK", { status: 200 });
};
