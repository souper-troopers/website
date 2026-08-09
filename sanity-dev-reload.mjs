// Vite plugin: reloads the Astro dev server whenever a document changes in the
// Sanity "production" dataset, so `npm run dev` reflects Studio publishes without
// a manual browser refresh. No-ops in production builds (apply: "serve").
import { createClient } from "@sanity/client";

export default function sanityDevReload() {
	return {
		name: "sanity-dev-reload",
		apply: "serve",
		configureServer(server) {
			const client = createClient({
				projectId: "wqa0no5g",
				dataset: "production",
				apiVersion: "2026-08-08",
				useCdn: false,
			});

			const subscription = client.listen("*[]").subscribe({
				next: () => {
					server.ws.send({ type: "full-reload" });
				},
				error: (err) => {
					console.warn("[sanity-dev-reload] listen error:", err.message);
				},
			});

			server.httpServer?.once("close", () => subscription.unsubscribe());
		},
	};
}
