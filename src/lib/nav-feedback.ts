/**
 * Show that a tap on a link did something (18 October). Reported: "sometimes when I click a link I
 * can't tell whether the browser is navigating", worse on a phone. With the ClientRouter the old
 * page simply stays put while the next one loads, and the browser shows no loading indicator of its
 * own for that; the warmed pages (src/lib/warm-pages.ts) swap at once, but any other page is a round
 * trip to Netlify's edge in São Paulo, ~0.2s or more from Cape Town, with nothing on screen.
 *
 * Two signals, each set up once per visit (module scripts run once; everything here hangs off
 * `document` and the bar lives on <html>, outside the <body> that each swap replaces):
 *
 * 1. Pressed look: the link or button under the finger dims (`data-pressed`, styled in Layout.astro)
 *    and stays dimmed briefly after release, so even a quick tap shows. On touch it waits
 *    PRESS_DELAY before dimming, so a finger that lands on a link to scroll doesn't flash it - the
 *    browser cancels the pointer (`pointercancel`) as soon as the scroll starts. This also avoids
 *    `:active`, which iOS only applies with a touchstart listener and then flashes while scrolling.
 *
 * 2. Loading bar: a thin teal line across the top of the screen while the next page loads, shown only
 *    once the wait has passed BAR_DELAY so pages that swap at once don't flicker. Router swaps start
 *    on `astro:before-preparation` and end on `astro:after-swap`; links the router leaves to the
 *    browser (Contact, external sites, every link on a `fullReload` page) start it on the click and
 *    end with the page itself, or on `pageshow` when one comes back from the back/forward cache.
 */

const PRESS_DELAY = 90;
const PRESS_HOLD = 160;
const BAR_DELAY = 150;

const PRESSABLE = "a[href], button, summary, [role='button']";

let pressed: Element | undefined;
let pressTimer: number | undefined;
let releaseTimer: number | undefined;

function setPressed(el: Element | undefined): void {
	window.clearTimeout(releaseTimer);
	if (pressed && pressed !== el) pressed.removeAttribute("data-pressed");
	pressed = el;
	el?.setAttribute("data-pressed", "");
}

function release(hold: boolean): void {
	window.clearTimeout(pressTimer);
	const el = pressed;
	if (!el) return;
	if (!hold) return setPressed(undefined);
	releaseTimer = window.setTimeout(() => {
		el.removeAttribute("data-pressed");
		if (pressed === el) pressed = undefined;
	}, PRESS_HOLD);
}

let bar: HTMLElement | undefined;
let barTimer: number | undefined;
let finishTimer: number | undefined;

function getBar(): HTMLElement {
	if (!bar || !bar.isConnected) {
		bar = document.createElement("div");
		bar.className = "nav-progress";
		bar.setAttribute("aria-hidden", "true");
		document.documentElement.append(bar);
	}
	return bar;
}

function startBar(): void {
	window.clearTimeout(barTimer);
	window.clearTimeout(finishTimer);
	barTimer = window.setTimeout(() => {
		const el = getBar();
		el.className = "nav-progress";
		// Read layout between the two classes so the creep starts from the beginning each time.
		void el.offsetWidth;
		el.className = "nav-progress is-loading";
	}, BAR_DELAY);
}

function finishBar(): void {
	window.clearTimeout(barTimer);
	if (!bar?.classList.contains("is-loading")) return;
	bar.className = "nav-progress is-done";
	finishTimer = window.setTimeout(() => bar && (bar.className = "nav-progress"), 400);
}

function resetBar(): void {
	window.clearTimeout(barTimer);
	window.clearTimeout(finishTimer);
	if (bar) bar.className = "nav-progress";
}

/** A click that will make the browser itself load another page (not the router, not this page). */
function leavesPage(event: MouseEvent): boolean {
	if (event.defaultPrevented || event.button !== 0) return false;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
	const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
	if (!link || link.hasAttribute("download")) return false;
	if (link.target && link.target !== "_self") return false;
	if (!/^https?:$/.test(link.protocol)) return false;
	// A jump to a spot on this same page loads nothing.
	if (link.pathname === location.pathname && link.search === location.search && link.hash) return false;
	return true;
}

export function initNavFeedback(): void {
	document.addEventListener(
		"pointerdown",
		(event) => {
			if (!event.isPrimary || event.button !== 0) return;
			const el = (event.target as Element | null)?.closest?.(PRESSABLE);
			if (!el || el.matches(":disabled, [aria-disabled='true']")) return;
			window.clearTimeout(pressTimer);
			if (event.pointerType === "mouse") setPressed(el);
			else pressTimer = window.setTimeout(() => setPressed(el), PRESS_DELAY);
		},
		{ passive: true },
	);
	// A tap quicker than PRESS_DELAY still shows: pressed on release, then held briefly.
	document.addEventListener("pointerup", (event) => {
		if (!pressed && pressTimer !== undefined) {
			const el = (event.target as Element | null)?.closest?.(PRESSABLE);
			if (el) setPressed(el);
		}
		release(true);
	});
	document.addEventListener("pointercancel", () => release(false));

	// After every other click handler, including the router's, which cancels the click when it takes
	// the navigation over (that one shows the bar from `astro:before-preparation` instead).
	document.addEventListener("click", (event) => {
		window.setTimeout(() => {
			if (leavesPage(event)) startBar();
		});
	});

	document.addEventListener("astro:before-preparation", startBar);
	document.addEventListener("astro:after-swap", finishBar);
	// Belt and braces: a router navigation that ends without a swap must not leave the bar running.
	document.addEventListener("astro:page-load", finishBar);
	// Back to a page kept in the back/forward cache: it would come back with the bar still running.
	window.addEventListener("pageshow", (event) => {
		if (event.persisted) {
			resetBar();
			release(false);
		}
	});
}
