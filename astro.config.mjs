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
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  integrations: [
    svelte(),
    sitemap({
      // Post-checkout landing pages and the internal pages written for Kerry & Shan are real routes
      // but not things anyone should arrive at from a search result. Excluding them here only stops
      // them being *advertised* — the internal ones also pass `noindex` to `Layout.astro`, which is
      // what actually keeps them out once the pre-launch blanket noindex comes off.
      filter: (page) =>
        !['/shop/order-confirmed/', '/shop/order-cancelled/', '/request-for-comment/', '/google-listing/'].some(
          (path) => page.endsWith(path)
        ),
    }),
  ],
  vite: {
    plugins: [sanityDevReload()]
  }
});