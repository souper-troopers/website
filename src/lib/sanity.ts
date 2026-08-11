import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export const sanityClient = createClient({
	projectId: "wqa0no5g",
	dataset: "production",
	apiVersion: "2026-08-08",
	useCdn: !import.meta.env.DEV,
});

const imageBuilder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
	return imageBuilder.image(source);
}

export interface SuccessStory {
	name: string;
	quote?: string;
	body: string;
	featured: boolean;
}

export interface TeamMember {
	name: string;
	role: string;
	bio?: string;
	photo?: SanityImageSource;
	photoLqip?: string;
}

export interface Partner {
	name: string;
	blurb: string;
	logo?: SanityImageSource;
	logoOnDark?: boolean;
}

export interface AttributeVariant {
	_key: string;
	label: string;
	price: number;
}

export interface ProductCategory {
	name: string;
	slug: string;
	blurb: string;
	photo?: SanityImageSource;
	photoLqip?: string;
	displayMode: "items" | "attributes";
	description?: any[];
	attributeVariants?: AttributeVariant[];
}

export interface ShopItem {
	_id: string;
	name: string;
	slug: string;
	price: number;
	photo?: SanityImageSource;
	photoLqip?: string;
	description?: string;
	details?: string;
	soldOut: boolean;
}

/** A ShopItem plus the category it belongs to — what a product page needs to render breadcrumbs and siblings. */
export interface ShopItemWithCategory extends ShopItem {
	categoryName: string;
	categorySlug: string;
}

/**
 * URL-safe slug from a product name, used when a `shopItem` has no explicit slug set.
 *
 * The 11 items migrated from WooCommerce predate the slug field, so without this every one of them
 * would have no product page at all until someone opened Sanity and generated slugs by hand. The
 * trade-off is that renaming an unslugged item silently changes its URL — hence the nudge in the
 * schema's field description to set a real slug once a product is out in the world.
 */
function slugify(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

const SHOP_ITEM_PROJECTION = `
	_id,
	name,
	"slug": slug.current,
	price,
	photo,
	"photoLqip": photo.asset->metadata.lqip,
	description,
	details,
	"soldOut": coalesce(soldOut, false),
`;

function withSlug<T extends { name: string; slug: string | null }>(item: T): T {
	return { ...item, slug: item.slug || slugify(item.name) };
}

export interface ImpactStat {
	label: string;
	value?: number;
	suffix?: string;
	displayValue?: string;
}

export interface SiteSettings {
	address: string;
	email: string;
	npoNumber: string;
	pboNumber: string;
	bbbeeLevel: string;
	bbbeeLastVerified?: string;
	bbbeeNote?: string;
}

export interface BbbeeBenefit {
	title: string;
	value?: string;
	body: string;
}

export interface Supporter {
	name: string;
	url?: string;
	note?: string;
}

export interface PressMention {
	publication: string;
	headline: string;
	url?: string;
	date?: string;
}

export async function getSuccessStories(): Promise<SuccessStory[]> {
	return sanityClient.fetch(`*[_type == "successStory"] | order(order asc)`);
}

export async function getFeaturedSuccessStories(): Promise<SuccessStory[]> {
	return sanityClient.fetch(`*[_type == "successStory" && featured == true] | order(order asc)`);
}

export async function getTeamMembers(): Promise<TeamMember[]> {
	return sanityClient.fetch(
		`*[_type == "teamMember"] | order(order asc) {
			name,
			role,
			bio,
			photo,
			"photoLqip": photo.asset->metadata.lqip,
		}`
	);
}

export async function getPartners(): Promise<Partner[]> {
	return sanityClient.fetch(`*[_type == "partner"] | order(order asc)`);
}

export async function getProductCategories(): Promise<ProductCategory[]> {
	return sanityClient.fetch(
		`*[_type == "productCategory"] | order(order asc) {
			name,
			"slug": slug.current,
			blurb,
			photo,
			"photoLqip": photo.asset->metadata.lqip,
			displayMode,
			description,
			attributeVariants,
		}`
	);
}

export async function getProductCategory(slug: string): Promise<ProductCategory | null> {
	return sanityClient.fetch(
		`*[_type == "productCategory" && slug.current == $slug][0] {
			name,
			"slug": slug.current,
			blurb,
			photo,
			"photoLqip": photo.asset->metadata.lqip,
			displayMode,
			description,
			attributeVariants,
		}`,
		{ slug }
	);
}

export async function getShopItems(categorySlug: string): Promise<ShopItem[]> {
	const items = await sanityClient.fetch(
		`*[_type == "shopItem" && category->slug.current == $categorySlug] | order(order asc) {
			${SHOP_ITEM_PROJECTION}
		}`,
		{ categorySlug }
	);
	return items.map(withSlug);
}

/**
 * Every item across every category, with its category's name and slug — the source for
 * `getStaticPaths` on the per-product pages, so one query covers the whole route.
 */
export async function getAllShopItems(): Promise<ShopItemWithCategory[]> {
	const items = await sanityClient.fetch(
		`*[_type == "shopItem" && defined(category->slug.current)] | order(order asc) {
			${SHOP_ITEM_PROJECTION}
			"categoryName": category->name,
			"categorySlug": category->slug.current,
		}`
	);
	return items.map(withSlug);
}

export async function getImpactStats(page: "home" | "our-work" | "donate"): Promise<ImpactStat[]> {
	return sanityClient.fetch(`*[_type == "impactStat" && page == $page] | order(order asc)`, { page });
}

export async function getSiteSettings(): Promise<SiteSettings> {
	return sanityClient.fetch(`*[_id == "siteSettings"][0]`);
}

export async function getBbbeeBenefits(): Promise<BbbeeBenefit[]> {
	return sanityClient.fetch(`*[_type == "bbbeeBenefit"] | order(order asc) { title, value, body }`);
}

export async function getSupporters(): Promise<Supporter[]> {
	return sanityClient.fetch(`*[_type == "supporter"] | order(lower(name) asc) { name, url, note }`);
}

export async function getPressMentions(): Promise<PressMention[]> {
	return sanityClient.fetch(
		`*[_type == "pressMention"] | order(date desc) { publication, headline, url, date }`
	);
}
