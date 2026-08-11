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
  prefetch: true,
  integrations: [
    svelte(),
    sitemap({
      // Post-checkout landing pages and the internal RFC page are real routes but not things anyone
      // should arrive at from a search result.
      filter: (page) =>
        !['/shop/order-confirmed/', '/shop/order-cancelled/', '/request-for-comment/'].some((path) =>
          page.endsWith(path)
        ),
    }),
  ],
  vite: {
    plugins: [sanityDevReload()]
  }
});