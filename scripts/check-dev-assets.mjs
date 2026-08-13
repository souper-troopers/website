#!/usr/bin/env node
/**
 * Startup smoke test, run as a fourth `concurrently` process by `npm run dev`.
 *
 * `free-dev-ports.mjs` removes the known cause (a stale process on the port). This catches the
 * *symptom* regardless of cause, which is the part that generalises: it asks the same question a
 * browser would — does an image actually come back through :8888? — and says so in one line.
 *
 * Deliberately checked through :8888 rather than :4321, because the proxy hop is itself a place
 * this breaks. `netlify dev` is pinned to `--target-port 4321`; if it is proxying to something
 * other than the Astro server we just started, testing Astro directly would pass while the URL
 * you actually browse stays broken. The check has to use the front door.
 *
 * Only local `/_image` assets are checked, not the Sanity CDN ones. The local pipeline is the part
 * that fails in a way you can neither see nor explain (Astro's image endpoint needs `sharp`, an
 * *optional* dependency of astro, so it can be absent or unresolvable while everything else works).
 * A remote CDN image failing means the internet is down — obvious, out of our hands, and not worth
 * a false alarm on every flaky connection.
 *
 * Never fails the dev session: it exits non-zero to colour the line, but the servers keep running.
 * The point is to put the diagnosis on screen at the moment it becomes true, instead of leaving it
 * to be rediscovered later as "the CSS is broken".
 */
const SITE = "http://localhost:8888";
const READY_TIMEOUT_MS = 120_000;

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Both servers are starting in parallel with this one, so "connection refused" means "not yet". */
async function waitForSite() {
	const deadline = Date.now() + READY_TIMEOUT_MS;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(SITE, { redirect: "follow" });
			if (res.ok) return await res.text();
		} catch {
			/* not listening yet */
		}
		await sleep(500);
	}
	return null;
}

function fail(headline, detail) {
	console.error(`\n${red("✗")} ${bold(headline)}\n${detail}\n`);
	process.exit(1);
}

const html = await waitForSite();

if (html === null) {
	fail(
		`No response from ${SITE} after ${READY_TIMEOUT_MS / 1000}s.`,
		`  Browse :8888, not :4321 — :4321 is raw Astro and has no /.netlify/functions/*.\n` +
			`  If only Astro came up, check the netlify dev pane above for a startup error.`,
	);
}

// Astro escapes & as &#38; in attributes; the URL is unusable un-decoded.
const match = html.match(/src="(\/_image\?[^"]+)"/);
const imageUrl = match?.[1].replaceAll("&#38;", "&").replaceAll("&amp;", "&");

if (!imageUrl) {
	fail(
		"The homepage rendered, but contains no /_image asset to test.",
		`  Every page carries the header logo through Astro's image endpoint, so this most likely\n` +
			`  means the page itself is wrong rather than the image pipeline. Open ${SITE} and look.`,
	);
}

let res;
try {
	res = await fetch(SITE + imageUrl);
} catch (error) {
	fail(`Could not reach the image endpoint at ${SITE}.`, `  ${error.message}`);
}

const contentType = res.headers.get("content-type") ?? "";

if (!res.ok || !contentType.startsWith("image/")) {
	const body = (await res.text().catch(() => "")).trim().split("\n")[0].slice(0, 200);
	fail(
		`Local images are broken — /_image returned ${res.status} (${contentType || "no content-type"}).`,
		`  ${body ? `Astro said: ${body}\n\n` : ""}` +
			`  Pages will render but every image from src/assets/images/ will be missing, while\n` +
			`  Sanity CDN images keep working — that split is the tell.\n\n` +
			`  If this mentions sharp: the server cached a failed module lookup at startup and will\n` +
			`  never retry. Stop everything and re-run \`npm run dev\` (predev clears the ports).\n` +
			`  If it persists across a restart, sharp is genuinely missing: \`npm install\`.`,
	);
}

console.log(`${green("✓")} images OK — /_image served ${contentType} through ${SITE}`);
