import { createClient } from "@sanity/client";

export const sanityClient = createClient({
	projectId: "wqa0no5g",
	dataset: "production",
	apiVersion: "2026-08-08",
	useCdn: true,
});

export interface SuccessStory {
	name: string;
	quote?: string;
	body: string;
	featured: boolean;
}

export interface TeamMember {
	name: string;
	role: string;
}

export interface Partner {
	name: string;
	blurb: string;
}

export interface Product {
	name: string;
	badge?: string;
	description: unknown[];
	priceRange: string;
	variantDetails?: string;
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
	tagline: string;
}

export async function getSuccessStories(): Promise<SuccessStory[]> {
	return sanityClient.fetch(`*[_type == "successStory"] | order(order asc)`);
}

export async function getFeaturedSuccessStories(): Promise<SuccessStory[]> {
	return sanityClient.fetch(`*[_type == "successStory" && featured == true] | order(order asc)`);
}

export async function getTeamMembers(): Promise<TeamMember[]> {
	return sanityClient.fetch(`*[_type == "teamMember"] | order(order asc)`);
}

export async function getPartners(): Promise<Partner[]> {
	return sanityClient.fetch(`*[_type == "partner"] | order(order asc)`);
}

export async function getProducts(): Promise<Product[]> {
	return sanityClient.fetch(`*[_type == "product"] | order(order asc)`);
}

export async function getImpactStats(page: "home" | "our-work" | "donate"): Promise<ImpactStat[]> {
	return sanityClient.fetch(`*[_type == "impactStat" && page == $page] | order(order asc)`, { page });
}

export async function getSiteSettings(): Promise<SiteSettings> {
	return sanityClient.fetch(`*[_id == "siteSettings"][0]`);
}
