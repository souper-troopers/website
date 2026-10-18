/**
 * Keep the main pages ready in memory, so moving to one is instant (18 October), and their banner
 * photos in the browser's cache.
 *
 * After a page has settled, the HTML of every link marked `data-preload-page` (the menu, Donate and
 * Shop - see Layout.astro) is fetched in the background, one at a time, and kept here for five
 * minutes. When the ClientRouter is about to load one of those pages, its loader is swapped for one
 * that builds the page from the copy in memory, so there is no wait at all.
 *
 * Why not Astro's own prefetch: our HTML is served `max-age=0, must-revalidate` (so a publish shows
 * at once), which means a prefetched copy in the browser's HTTP cache still has to be confirmed with
 * the server before use - from Cape Town a ~0.2s round trip to Netlify's edge in São Paulo, most of
 * the delay. And in Safari, Astro's prefetch is a plain fetch() into the HTTP cache, the thing that
 * blanked pages in September when a full page load reused it. Here every fetch is `no-store`: nothing
 * reaches the browser's cache, only this module's memory.
 *
 * Skipped on Save-Data and 2g connections. A copy older than MAX_AGE is never used and is fetched
 * again on the next page.
 */

const MAX_AGE = 5 * 60_000;

interface Copy {
	html: string;
	/** Where the request ended up: Netlify redirects /about to /about/. */
	url: string;
	at: number;
}

const copies = new Map<string, Copy>();
const inFlight = new Set<string>();

/** /about and /about/ are the same page. */
function keyOf(url: URL): string {
	return url.origin + url.pathname.replace(/\/$/, "") + url.search;
}

function fresh(copy: Copy | undefined): copy is Copy {
	return !!copy && Date.now() - copy.at < MAX_AGE;
}

function slowConnection(): boolean {
	const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
	return !!conn && (!!conn.saveData || /2g/.test(conn.effectiveType ?? ""));
}

async function fetchCopy(url: URL): Promise<void> {
	const key = keyOf(url);
	if (fresh(copies.get(key)) || inFlight.has(key)) return;
	inFlight.add(key);
	try {
		const res = await fetch(url.href, { cache: "no-store", credentials: "same-origin" });
		const type = res.headers.get("content-type") ?? "";
		if (!res.ok || !type.startsWith("text/html")) return;
		const copy = { html: await res.text(), url: res.url, at: Date.now() };
		copies.set(key, copy);
		copies.set(keyOf(new URL(res.url)), copy);
	} catch {
		// Offline or blocked: the router will simply load the page itself.
	} finally {
		inFlight.delete(key);
	}
}

/** Fetch the marked pages one after another, once the current page has had a moment to settle. */
export function warmMarkedPages(): void {
	if (slowConnection()) return;
	const here = keyOf(new URL(location.href));
	const urls = [...document.querySelectorAll<HTMLAnchorElement>("a[data-preload-page]")]
		.map((a) => new URL(a.href))
		.filter((u, i, all) => u.origin === location.origin && keyOf(u) !== here && all.findIndex((v) => keyOf(v) === keyOf(u)) === i);
	const start = async () => {
		for (const url of urls) await fetchCopy(url);
		// Then each page's banner photo (18 October), one at a time at low priority: ~40-130KB each
		// on a phone, ~350KB for the five, once per visitor - photos are cached for good. Only the
		// banner, not the photos further down. Same sizes/srcset as the page, so the browser picks
		// the very file that page will ask for, and the swapped-in page finds it already loaded
		// (PhotoHero shows it at once, with no fade).
		for (const url of urls) {
			const copy = copies.get(keyOf(url));
			if (fresh(copy)) await preloadHero(copy.html);
		}
	};
	if ("requestIdleCallback" in window) requestIdleCallback(() => void start(), { timeout: 3000 });
	else setTimeout(() => void start(), 1500);
}

const preloadedHeroes = new Set<string>();

function preloadHero(html: string): Promise<void> {
	const source = new DOMParser().parseFromString(html, "text/html").querySelector<HTMLImageElement>(".photo-hero .hero-bg img");
	const srcset = source?.getAttribute("srcset");
	if (!source || !srcset || preloadedHeroes.has(srcset)) return Promise.resolve();
	preloadedHeroes.add(srcset);
	const img = new Image();
	img.fetchPriority = "low";
	img.decoding = "async";
	// sizes before srcset before src, so the browser chooses from the full set.
	img.sizes = source.getAttribute("sizes") ?? "100vw";
	img.srcset = srcset;
	img.src = source.getAttribute("src") ?? "";
	return img.decode().catch(() => {});
}

/**
 * Serve the router from memory when there is a fresh copy. Mirrors what Astro's own loader does
 * after its fetch (router.js `defaultLoader`): follow the redirect, drop <noscript>, refuse a page
 * without the router (so it gets a full load), and wait for any stylesheet this page hasn't loaded.
 */
document.addEventListener("astro:before-preparation", (event) => {
	if (event.formData) return;
	const copy = copies.get(keyOf(event.to));
	if (!fresh(copy)) return;
	const original = event.loader;
	event.loader = async () => {
		const doc = new DOMParser().parseFromString(copy.html, "text/html");
		if (!doc.querySelector('meta[name="astro-view-transitions-enabled"]')) return original();
		const to = new URL(copy.url);
		to.hash = event.to.hash;
		event.to = to;
		doc.querySelectorAll("noscript").forEach((el) => el.remove());
		const newSheets = [...doc.querySelectorAll<HTMLLinkElement>("head link[rel=stylesheet]")].filter(
			(link) => !document.querySelector(`link[rel=stylesheet][href="${link.getAttribute("href")}"]`),
		);
		await Promise.all(
			newSheets.map(
				(link) =>
					new Promise<void>((resolve) => {
						const preload = document.createElement("link");
						preload.rel = "preload";
						preload.as = "style";
						preload.href = link.getAttribute("href") ?? "";
						preload.onload = preload.onerror = () => resolve();
						document.head.append(preload);
					}),
			),
		);
		event.newDocument = doc;
	};
});
