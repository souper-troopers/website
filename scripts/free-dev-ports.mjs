#!/usr/bin/env node
/**
 * Runs as `predev`, so every `npm run dev` starts from known-good processes.
 *
 * The problem it exists to prevent (cost a full debugging session on 2026-08-13): a dev server
 * that is *running* is not necessarily a dev server that *works*. Node caches a failed `require`
 * for the life of the process, so an `astro dev` that couldn't resolve `sharp` at startup keeps
 * returning 500 from `/_image` — forever, silently, for every local image — while every page it
 * serves still renders. That one had been up for three and a half days.
 *
 * What made it invisible rather than merely broken is the port drift. `astro dev` does not fail
 * when 4321 is taken; it quietly takes 4322. So a second, healthy server can be running on a port
 * nobody is looking at, while `netlify dev` — pinned to `--target-port 4321` — keeps proxying
 * :8888 to the broken original. Everything reports success and the site is served by a zombie.
 *
 * Astro's own lock file (`.astro/dev.json`, plus `astro dev --force`) covers only the server it
 * tracks, which is exactly the one that isn't the problem: the stale process here was untracked,
 * so `--force` would have skipped it and drifted to 4322 all over again. Hence going by port.
 *
 * Deliberately scoped by command line: it kills a listener only when its argv contains this
 * project's absolute path, and *stops* rather than continuing if a port is held by anything else.
 * Stopping matters more than it looks — silently leaving a foreign process on 4321 recreates the
 * original bug, since Astro would drift again. A loud failure you can act on beats a dev server
 * that starts and lies.
 *
 * Consequence worth knowing: a second `npm run dev` in another terminal replaces the first one's
 * servers instead of racing it onto shifted ports. That is the intended trade — one dev
 * environment on the documented ports, never two with one of them wrong.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The three ports `npm run dev` binds: Astro, the Sanity Studio, and the netlify functions proxy. */
const PORTS = [
	{ port: 4321, label: "astro" },
	{ port: 3333, label: "sanity studio" },
	{ port: 8888, label: "netlify dev" },
];

/** lsof exits non-zero when nothing matches, which is the common case, not an error. */
function listenersOn(port) {
	try {
		const out = execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		return out.split("\n").filter(Boolean).map(Number);
	} catch {
		return [];
	}
}

function commandOf(pid) {
	try {
		return execFileSync("ps", ["-o", "command=", "-p", String(pid)], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return "";
	}
}

function isAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

/** SIGTERM first so the server can clean up (Astro removes its own lock file on a graceful stop). */
async function stop(pid) {
	try {
		process.kill(pid, "SIGTERM");
	} catch {
		return;
	}
	for (let i = 0; i < 50 && isAlive(pid); i++) {
		await new Promise((r) => setTimeout(r, 100));
	}
	if (isAlive(pid)) {
		try {
			process.kill(pid, "SIGKILL");
		} catch {
			/* already gone */
		}
	}
}

/**
 * Astro writes the lock on start and removes it on a graceful stop, so a SIGKILL — or a machine
 * that restarted with a dev server running — leaves one behind pointing at a pid that no longer
 * exists. `astro dev` then refuses to start, citing a server that isn't there.
 */
function clearStaleLock() {
	const lock = join(projectRoot, ".astro", "dev.json");
	if (!existsSync(lock)) return;
	try {
		const { pid } = JSON.parse(readFileSync(lock, "utf8"));
		if (typeof pid === "number" && isAlive(pid)) return;
		rmSync(lock);
		console.log("  cleared a stale .astro/dev.json (its process is gone)");
	} catch {
		rmSync(lock, { force: true });
	}
}

let freed = 0;
let blocked = false;

for (const { port, label } of PORTS) {
	for (const pid of listenersOn(port)) {
		const command = commandOf(pid);
		if (command.includes(projectRoot)) {
			await stop(pid);
			console.log(`  freed :${port} (${label}, pid ${pid})`);
			freed++;
		} else {
			console.error(
				`\n  Port ${port} (${label}) is held by a process that is not part of this project:\n` +
					`    pid ${pid}: ${command || "<unknown>"}\n\n` +
					`  Refusing to kill it. Free the port yourself and re-run, or that process will\n` +
					`  keep the port and the dev server will silently start on a different one.\n`,
			);
			blocked = true;
		}
	}
}

clearStaleLock();

if (blocked) process.exit(1);
if (freed > 0) console.log(`  dev ports clear (${freed} stale process${freed === 1 ? "" : "es"} stopped)`);
