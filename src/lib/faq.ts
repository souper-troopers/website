/**
 * Question-and-answer blocks, and the `FAQPage` structured data that goes with them.
 *
 * **The point of these is the visible text, not the structured data.** Google retired FAQ rich
 * results for most sites, so the schema block below buys nothing in a search listing. What it is
 * for is the other half of "built to be found": an assistant answering "is Souper Troopers a
 * shelter?" retrieves a chunk of a page and quotes it, so the literal question has to exist on the
 * page in the words somebody would ask it, with the answer in the sentence directly underneath.
 *
 * ⚠ Every answer here must already be true somewhere else on the site — these pages restate facts
 * in question form, they do not introduce new claims. Anything that needs a decision or a fact we
 * do not have becomes a question on `/request-for-comment` instead of a plausible-sounding answer.
 */
export interface FaqItem {
	question: string;
	/** Plain text. It is both the visible answer and `acceptedAnswer.text`, so it must read as a complete answer without the page around it. */
	answer: string;
	/** Rendered under the answer as a mailto with a copy button. Appended to the structured-data text so the machine-readable answer is not missing the route in. */
	email?: string;
	/** Optional onward link, visible only — a `BreadcrumbList` of one is not what `acceptedAnswer` is for. */
	link?: { href: string; label: string };
}

export function faqPageJsonLd(items: FaqItem[]) {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.email ? `${item.answer} Email ${item.email}.` : item.answer,
			},
		})),
	};
}
