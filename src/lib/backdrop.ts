import sharp from "sharp";

/**
 * The colour of a photo's own backdrop, read at build time from its top edge (25 September).
 *
 * Product cards leave room above the photo, and that room has to be the photo's backdrop colour or
 * it shows as a band: the dolls are shot on white, the gift tags on a grey sweep. Sanity's palette
 * describes the product's colours, not the backdrop, so this reads the image itself - the
 * per-channel median of its top (or bottom) 12 rows, where a studio shot is almost all backdrop.
 * The shop landing tiles read the bottom edge, since their words sit below the photo.
 *
 * Returns undefined on any failure; the card then falls back to white.
 */
export async function backdropColour(
	url: string | undefined,
	edge: "top" | "bottom" = "top",
): Promise<string | undefined> {
	if (!url) return undefined;
	try {
		const res = await fetch(url);
		if (!res.ok) return undefined;
		const buffer = Buffer.from(await res.arrayBuffer());
		const image = sharp(buffer);
		const { width, height } = await image.metadata();
		if (!width || !height) return undefined;
		// The per-channel median, not sharp's `dominant` (which is quantised to steps of ~16 and
		// left a faint seam) or the mean (which a pom-pom touching the top edge would skew).
		const { data, info } = await image
			.extract({ left: 0, top: edge === "top" ? 0 : height - 12, width, height: 12 })
			.removeAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		// On the bottom edge only the outer 15% each side counts: a product often runs to the bottom of
		// the frame (the coffee's spilled beans, the bracelets' stand), and the corners beside it are
		// the backdrop.
		const corner = edge === "bottom" ? Math.round(info.width * 0.15) : info.width;
		const channels: number[][] = [[], [], []];
		for (let i = 0; i < data.length; i += info.channels) {
			const x = (i / info.channels) % info.width;
			if (edge === "bottom" && x >= corner && x < info.width - corner) continue;
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
