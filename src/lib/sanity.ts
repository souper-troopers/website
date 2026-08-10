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
	price: number;
	photo?: SanityImageSource;
	photoLqip?: string;
	description?: string;
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
	return sanityClient.fetch(
		`*[_type == "shopItem" && category->slug.current == $categorySlug] | order(order asc) {
			_id,
			name,
			price,
			photo,
			"photoLqip": photo.asset->metadata.lqip,
			description,
		}`,
		{ categorySlug }
	);
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
