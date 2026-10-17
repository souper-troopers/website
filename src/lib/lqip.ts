import sharp from "sharp";
import type { ImageMetadata } from "astro";

/**
 * A tiny blurred preview of a local photo, inlined as a data URI (~600 bytes), so a hero paints a
 * soft version of its own photo with the page instead of a dark box that the photo then pops into
 * (17 October: reported on a phone as "layout popping" between pages - the banner heights never
 * change, it is the photo arriving late over the ink background).
 *
 * Read at build time from the source file. `fsPath` is a non-enumerable property Astro puts on
 * every imported image; if a future Astro drops it, this returns undefined and the hero simply
 * goes back to the ink background - nothing breaks.
 */
const cache = new Map<string, Promise<string | undefined>>();

export function lqipFor(image: ImageMetadata): Promise<string | undefined> {
	const fsPath = (image as ImageMetadata & { fsPath?: string }).fsPath;
	if (!fsPath) return Promise.resolve(undefined);
	let pending = cache.get(fsPath);
	if (!pending) {
		pending = sharp(fsPath)
			.resize(24)
			.jpeg({ quality: 40 })
			.toBuffer()
			.then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`)
			.catch(() => undefined);
		cache.set(fsPath, pending);
	}
	return pending;
}
