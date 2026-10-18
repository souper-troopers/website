// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

import sanityDevReload from './sanity-dev-reload.mjs';

// https://astro.build/config
export default defineConfig({
  // The real address since launch (October 2026). Used to build absolute canonical/Open Graph URLs
  // and the sitemap. www.soupertroopers.org redirects here (set as the primary domain in Netlify).
  site: 'https://soupertroopers.org',
  /**
   * Off since 7 September, and staying off: in Safari it blanked pages (a full page load reusing the
   * copy Astro's fetch() fallback had put in the HTTP cache showed a blank page offering
   * "document.txt"). Astro's prefetch also couldn't help much here: our HTML is `max-age=0,
   * must-revalidate`, so a cached copy still costs a round trip to Netlify's edge (São Paulo, from
   * Cape Town) before use. Pages are instead kept in memory by src/lib/warm-pages.ts (18 October),
   * which feeds the ClientRouter directly and never touches the HTTP cache.
   */
  prefetch: false,
  integrations: [
    svelte(),
    sitemap({
      // Post-checkout landing pages and the internal pages written for Kerry & Shan are real routes
      // but not things anyone should arrive at from a search result. Excluding them here only stops
      // them being *advertised* — the internal ones also pass `noindex` to `Layout.astro`, which is
      // what actually keeps them out once the pre-launch blanket noindex comes off.
      // '/save-our-hub/' is a draft awaiting Kerry's approval - remove it from this list when
      // CAMPAIGN.live goes true (src/lib/campaign.ts).
      filter: (page) =>
        !['/shop/order-confirmed/', '/shop/order-cancelled/', '/request-for-comment/', '/google-listing/', '/shmiley-decision/', '/video-brief/', '/internal/', '/changelog/', '/editing-guide/', '/contact/thanks/', '/save-our-hub/'].some(
          (path) => page.endsWith(path)
        ),
    }),
  ],
  vite: {
    plugins: [sanityDevReload()]
  }
});