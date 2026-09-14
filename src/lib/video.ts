/**
 * Turns a YouTube or Vimeo link, as pasted into the Studio, into what a story card needs in order to
 * show the video without loading the provider's player until someone presses play.
 *
 * Returns null for anything it doesn't recognise, and the card falls back to a plain link - so a
 * mistyped or unusual URL still reaches the video rather than silently vanishing.
 */
export interface VideoEmbed {
	provider: "youtube" | "vimeo";
	/** The player URL, set to autoplay - it is only ever loaded by a click. */
	src: string;
	/** A still to show until then, when one can be found. */
	thumbnail?: string;
}

export async function videoEmbed(link: string): Promise<VideoEmbed | null> {
	let url: URL;
	try {
		url = new URL(link);
	} catch {
		return null;
	}
	const host = url.hostname.replace(/^(www|m)\./, "");

	let youtubeId: string | null = null;
	if (host === "youtu.be") {
		youtubeId = url.pathname.slice(1).split("/")[0];
	} else if (host === "youtube.com" || host === "youtube-nocookie.com") {
		youtubeId = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
	}
	if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
		return {
			provider: "youtube",
			// The no-cookie host: YouTube sets nothing until the video is actually played.
			src: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`,
			// 4:3 with letterbox bars on a 16:9 video; the 16:9 frame's object-fit crops exactly those.
			thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
		};
	}

	if (host === "vimeo.com" || host === "player.vimeo.com") {
		// An unlisted Vimeo video carries a privacy hash, as a second path segment on a share link or
		// as ?h= on a player link. Without it the player refuses to play.
		const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/);
		if (match) {
			const [, id, pathHash] = match;
			const hash = pathHash ?? url.searchParams.get("h");
			return {
				provider: "vimeo",
				src: `https://player.vimeo.com/video/${id}?autoplay=1${hash ? `&h=${hash}` : ""}`,
				thumbnail: await vimeoThumbnail(link),
			};
		}
	}

	return null;
}

// Vimeo has no thumbnail address that can be worked out from the id, so ask its oEmbed endpoint at
// build time. A failure costs only the still - the card shows the play button on a dark frame.
async function vimeoThumbnail(link: string): Promise<string | undefined> {
	try {
		const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(link)}&width=960`);
		if (!response.ok) return undefined;
		const data = await response.json();
		return typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined;
	} catch {
		return undefined;
	}
}
