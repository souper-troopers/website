/**
 * One definition of a breadcrumb trail, used for both the visible `<nav>` and the `BreadcrumbList`
 * structured data — because those two disagreeing is exactly the failure this site already guards
 * against elsewhere (see the trailing-slash note in AGENTS.md under "Shop discoverability").
 *
 * `path` is root-relative and **must carry a trailing slash**, matching Astro's own canonical and
 * sitemap URLs. Structured data pointing at `/shop/coffee` while the canonical tag on the same page
 * says `/shop/coffee/` reads as two URLs for one page.
 */
export interface Crumb {
	name: string;
	path: string;
}

/**
 * The schema.org block for a trail. Every crumb gets a URL, including the current page — the visible
 * nav leaves the last one unlinked, but `BreadcrumbList` positions are addresses, not links.
 */
export function breadcrumbList(crumbs: Crumb[], site: URL | undefined) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((crumb, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: crumb.name,
			item: new URL(crumb.path, site).href,
		})),
	};
}
