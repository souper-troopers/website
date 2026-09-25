import sharp from "sharp";

/**
 * The colour of a photo's own backdrop, read at build time from its top edge (25 September).
 *
 * Product cards leave room above the photo, and that room has to be the photo's backdrop colour or
 * it shows as a band: the dolls are shot on white, the gift tags on a grey sweep. Sanity's palette
 * describes the product's colours, not the backdrop, so this reads the image itself - the
 * per-channel median of its top 12 rows, where a studio shot is almost all backdrop.
 *
 * Returns undefined on any failure; the card then falls back to white.
 */
export async function backdropColour(url: string | undefined): Promise<string | undefined> {
	if (!url) return undefined;
	try {
		const res = await fetch(url);
		if (!res.ok) return undefined;
		const buffer = Buffer.from(await res.arrayBuffer());
		const image = sharp(buffer);
		const { width } = await image.metadata();
		if (!width) return undefined;
		// The per-channel median, not sharp's `dominant` (which is quantised to steps of ~16 and
		// left a faint seam) or the mean (which a pom-pom touching the top edge would skew).
		const { data, info } = await image
			.extract({ left: 0, top: 0, width, height: 12 })
			.removeAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const channels: number[][] = [[], [], []];
		for (let i = 0; i < data.length; i += info.channels) {
			for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
		}
		const hex = (values: number[]) => {
			values.sort((a, b) => a - b);
			return values[Math.floor(values.length / 2)].toString(16).padStart(2, "0");
		};
		return `#${channels.map(hex).join("")}`;
	} catch {
		return undefined;
	}
}
