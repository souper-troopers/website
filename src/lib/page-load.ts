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
