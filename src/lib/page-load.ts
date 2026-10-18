/**
 * Run `setup` once for every page shown, whether it arrived by a full load or was swapped in by
 * Astro's ClientRouter (17 October).
 *
 * Why this exists: with the router, a bundled <script> runs only the first time it is seen, so code
 * that finds elements on the page at module level would wire up the first page and then never the
 * pages swapped in after it. The router fires `astro:page-load` after the first load and after
 * every swap. Pages that opt out of the router (`<Layout fullReload>`) never fire it, so there the
 * setup runs directly.
 *
 * `setup` gets an AbortSignal that fires just before the page is swapped out: pass it to any
 * listener on `window` or `document` so they don't pile up from page to page.
 */
export function onEveryPage(setup: (signal: AbortSignal) => void): void {
	let controller: AbortController | undefined;
	const run = () => {
		controller?.abort();
		controller = new AbortController();
		setup(controller.signal);
	};
	if (document.querySelector('meta[name="astro-view-transitions-enabled"]')) {
		document.addEventListener("astro:page-load", run);
		document.addEventListener("astro:before-swap", () => controller?.abort());
	} else {
		run();
	}
}

/**
 * Pages that opt out of the ClientRouter with `<Layout fullReload>` - keep this list and those props
 * in step. Links to them must never be fetched by script first: the router would fetch the page,
 * find no router on it and then do a full load of the same address, and a full load reusing a
 * script-fetched copy is what blanked pages in Safari in September (AGENTS.md, "Link prefetching is
 * OFF"). So links to these get `data-astro-reload` (the router leaves them to the browser) and are
 * never prefetched.
 */
export const FULL_RELOAD_PATHS = ["/contact", "/save-our-hub", "/request-for-comment"];

export function isFullReloadPath(pathname: string): boolean {
	return FULL_RELOAD_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
