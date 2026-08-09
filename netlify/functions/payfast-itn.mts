import { createHash } from "node:crypto";

function phpUrlEncode(value: string): string {
	return encodeURIComponent(value).replace(/%20/g, "+");
}

// Recomputes the signature the same way create-payfast-payment.mts does, but over
// whatever fields PayFast actually sent back (order as received, signature excluded).
function verifySignature(fields: Record<string, string>, passphrase: string): boolean {
	const received = fields.signature;
	if (!received) return false;

	const pairs = Object.entries(fields)
		.filter(([key, value]) => key !== "signature" && value !== "" && value !== undefined)
		.map(([key, value]) => `${key}=${phpUrlEncode(value)}`);
	let query = pairs.join("&");
	if (passphrase) query += `&passphrase=${phpUrlEncode(passphrase)}`;

	const expected = createHash("md5").update(query).digest("hex");
	return expected === received;
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

	const signatureOk = verifySignature(fields, passphrase);
	const payfastConfirmed = signatureOk && (await confirmWithPayfast(rawBody, mode));

	if (!signatureOk || !payfastConfirmed) {
		console.error("PayFast ITN rejected", { signatureOk, payfastConfirmed, paymentId: fields.m_payment_id });
		return new Response("Invalid notification", { status: 400 });
	}

	if (fields.payment_status === "COMPLETE") {
		// Verified and paid. No order-tracking database exists yet (see
		// docs/shop-checkout-decision.md — inventory/order tracking was deliberately
		// out of scope for v1). For now this just acknowledges the notification;
		// order visibility lives in the PayFast merchant dashboard directly.
		console.log("PayFast payment confirmed", {
			paymentId: fields.m_payment_id,
			amount: fields.amount_gross,
			item: fields.item_name,
		});
	} else {
		console.log("PayFast ITN received with non-complete status", {
			paymentId: fields.m_payment_id,
			status: fields.payment_status,
		});
	}

	return new Response("OK", { status: 200 });
};
