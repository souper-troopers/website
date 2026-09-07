// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

import sanityDevReload from './sanity-dev-reload.mjs';

// https://astro.build/config
export default defineConfig({
  // Netlify preview URL — update again for the real domain before launch (see
  // "Before real launch" in AGENTS.md). Used to build absolute canonical/Open Graph URLs.
  site: 'https://souper-troopers.netlify.app',
  // `prefetch: true` on its own prefetches NOTHING — it only loads the runtime. `prefetchAll`
  // defaults to false, so with no `data-astro-prefetch` attribute anywhere, every link failed
  // `elMatchesStrategy` and no strategy ever matched (verified in the built bundle, 2026-08-13).
  // `prefetchAll` opts every same-origin link in; `viewport` rather than the `hover` default
  // because hover is a pointer-only event and this was reported on a phone, where it can only
  // fire on the tap that is already navigating. Astro skips prefetch when the browser reports
  // Save-Data or a 2g connection, so this stays polite on poor mobile connections.
  /**
   * ⚠ TEMPORARILY DISABLED to test the Safari blank-page bug (2026-09-07).
   *
   * Symptom: clicking a link in Safari (macOS and iOS, and iOS Chrome, which is also WebKit) lands
   * on a blank page with a download bar offering "document.txt". Reloading fixes it. Server headers
   * are correct - checked against production, every page returns text/html; charset=UTF-8.
   *
   * Why prefetch is the suspect: Astro only reaches its `fetch()` fallback in browsers where
   * `link.relList.supports("prefetch")` is false, which is exactly Safari - Chrome and Firefox take
   * the `<link rel=prefetch>` branch and are unaffected. On a static build the fallback is a bare
   * `fetch(url, {priority:"low"})` that populates the HTTP cache, and Safari reusing such an entry
   * for a *navigation* is a known source of exactly this symptom. It also explains why only some
   * pages break (only links actually prefetched) and why a reload cures it.
   *
   * If this turns out not to be the cause, restore:
   *   prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
   * and remove nothing else - the `data-astro-prefetch="load"` attributes on the nav links are
   * inert while the runtime is not shipped.
   */
  prefetch: false,
  integrations: [
    svelte(),
    sitemap({
      // Post-checkout landing pages and the internal pages written for Kerry & Shan are real routes
      // but not things anyone should arrive at from a search result. Excluding them here only stops
      // them being *advertised* — the internal ones also pass `noindex` to `Layout.astro`, which is
      // what actually keeps them out once the pre-launch blanket noindex comes off.
      filter: (page) =>
        !['/shop/order-confirmed/', '/shop/order-cancelled/', '/request-for-comment/', '/google-listing/', '/shmiley-decision/', '/video-brief/', '/internal/', '/changelog/'].some(
          (path) => page.endsWith(path)
        ),
    }),
  ],
  vite: {
    plugins: [sanityDevReload()]
  }
});