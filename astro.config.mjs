// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import sanityDevReload from './sanity-dev-reload.mjs';

// https://astro.build/config
export default defineConfig({
  // Netlify preview URL — update again for the real domain before launch (see
  // "Before real launch" in AGENTS.md). Used to build absolute canonical/Open Graph URLs.
  site: 'https://souper-troopers.netlify.app',
  prefetch: true,
  integrations: [svelte()],
  vite: {
    plugins: [sanityDevReload()]
  }
});