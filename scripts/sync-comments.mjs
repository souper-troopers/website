/**
 * Pull the production comment threads into the local Netlify Blobs store, so `netlify dev` shows
 * `/request-for-comment` the way Kerry and Shan actually see it.
 *
 * ── Why this is needed at all ────────────────────────────────────────────────────────────────
 * `netlify dev` serves Blobs out of `.netlify/blobs-serve/`, which is gitignored and entirely
 * separate from production. That separation is deliberate and worth keeping — it is what stops a
 * test comment landing in a real thread. The cost is that locally the page shows none of the real
 * conversation, and until this script existed the local store instead held leftover fixtures from
 * when the feature was built (a fake "Kerry" comment, plus `racetest`/`seqtest`/`dbg` keys).
 *
 * That gap became actively misleading on 2026-08-27, when Shan's second batch of replies was
 * recorded on the page *without* copying the text in — the replies were already live in the threads,
 * and restating them would have shown the same words twice with two dates. So a question can now
 * carry a "Shan replied - still open" chip whose reply exists only in production. Locally that reads
 * as a bug: the chip claims a reply and the thread beneath it is empty.
 *
 * ── What it does ─────────────────────────────────────────────────────────────────────────────
 * Copies every thread from the production `rfc-comments` store into the local one, and removes local
 * keys that do not exist in production (the fixtures above). **It only ever writes inside
 * `.netlify/blobs-serve/`** — there is no code path here that writes to production, deliberately:
 * this is a tool for reading real data locally, not for editing it.
 *
 * Pass `--keep-local` to copy production down without deleting anything local, if you have local-only
 * threads you want to hang on to.
 *
 * Needs the Netlify CLI linked to the site (`npx netlify status`).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

const run = promisify(execFile);

const STORE = "rfc-comments";
const KEEP_LOCAL = process.argv.includes("--keep-local");

const ROOT = process.cwd();
const SERVE = path.join(ROOT, ".netlify", "blobs-serve");
const ENTRIES = path.join(SERVE, "entries", "unlinked", `site:${STORE}`);
const METADATA = path.join(SERVE, "metadata", "unlinked", `site:${STORE}`);

// Belt and braces: every write below is derived from SERVE, and this is the one assertion that
// keeps it that way if the layout above is ever edited carelessly.
for (const dir of [ENTRIES, METADATA]) {
	if (!path.resolve(dir).startsWith(path.resolve(SERVE) + path.sep)) {
		console.error(`sync-comments: refusing to write outside ${SERVE}`);
		process.exit(1);
	}
}

async function netlify(args) {
	try {
		const { stdout } = await run("npx", ["netlify", ...args], { maxBuffer: 16 * 1024 * 1024 });
		return stdout;
	} catch (error) {
		const detail = (error.stderr || error.message || "").trim().split("\n").slice(-3).join("\n");
		throw new Error(`\`netlify ${args.join(" ")}\` failed:\n${detail}`);
	}
}

/** Small concurrency limit: each call is a fresh `npx` process, so unbounded is slower, not faster. */
async function mapLimit(items, limit, fn) {
	const results = [];
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (next < items.length) {
				const index = next++;
				results[index] = await fn(items[index]);
			}
		})
	);
	return results;
}

const listed = JSON.parse(await netlify(["blobs:list", STORE, "--json"]));
const keys = (listed.blobs ?? []).map((blob) => blob.key).filter(Boolean).sort();
if (!keys.length) {
	console.error(`sync-comments: production store "${STORE}" is empty - nothing copied.`);
	process.exit(1);
}

await mkdir(ENTRIES, { recursive: true });
await mkdir(METADATA, { recursive: true });

const threads = await mapLimit(keys, 4, async (key) => {
	const body = await netlify(["blobs:get", STORE, key]);
	// Guard against the CLI ever printing something that isn't the blob: writing a warning banner
	// into the store would fail later, in the browser, as an unreadable thread.
	let parsed;
	try {
		parsed = JSON.parse(body);
	} catch {
		throw new Error(`thread "${key}" did not come back as JSON - aborting rather than storing it`);
	}
	if (!Array.isArray(parsed)) throw new Error(`thread "${key}" is not an array of comments`);
	await writeFile(path.join(ENTRIES, key), JSON.stringify(parsed));
	await writeFile(path.join(METADATA, key), "{}");
	return { key, count: parsed.length };
});

let removed = [];
if (!KEEP_LOCAL) {
	const local = await readdir(ENTRIES).catch(() => []);
	removed = local.filter((key) => !keys.includes(key));
	for (const key of removed) {
		await rm(path.join(ENTRIES, key), { force: true });
		await rm(path.join(METADATA, key), { force: true });
	}
}

const comments = threads.reduce((total, thread) => total + thread.count, 0);
console.log(`sync-comments: copied ${threads.length} threads (${comments} comments) from production.`);
if (removed.length) console.log(`sync-comments: removed ${removed.length} local-only key(s): ${removed.join(", ")}`);
else if (KEEP_LOCAL) console.log("sync-comments: left local-only keys in place (--keep-local).");
console.log("sync-comments: local only - production was not modified.");
