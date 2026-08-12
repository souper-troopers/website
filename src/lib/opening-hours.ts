/**
 * Single source of truth for the Humanity Hub's opening hours.
 *
 * Two consumers that must never disagree: the human-readable list on the contact page, and the
 * `openingHoursSpecification` in the site-wide NGO structured data (`Layout.astro`). Search engines
 * cross-check structured data against what a page visibly says, and a listing whose hours contradict
 * the website is worse than one with no hours at all — so the display strings are *derived* from the
 * 24-hour values rather than written alongside them. There is deliberately no second place to edit.
 *
 * These are also the hours to enter on the Google Business Profile — see
 * `docs/google-business-profile.md`. Keeping all three in agreement is the whole point.
 *
 * ⚠ Visits are by appointment, not drop-in. schema.org has no way to express that on
 * `OpeningHoursSpecification`, so the qualifier lives in visible copy on the contact page and as the
 * "by appointment only" attribute on the Google listing. Don't publish these hours anywhere that
 * can't carry that qualifier alongside them.
 */

type OpeningHours = {
	/** Shown on the contact page, e.g. "Mon–Thu". */
	label: string;
	/** schema.org `DayOfWeek` names this row covers. */
	days: string[];
	/** 24-hour "HH:MM" — the canonical value both outputs derive from. */
	opens: string;
	closes: string;
};

const hours: OpeningHours[] = [
	{
		label: "Mon–Thu",
		days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
		opens: "08:30",
		closes: "16:00",
	},
	{
		label: "Fri",
		days: ["Friday"],
		opens: "08:30",
		closes: "15:00",
	},
];

/** "08:30" → "8:30am", "16:00" → "4pm". Drops ":00" so whole hours read as they're spoken. */
function formatTime(time: string): string {
	const [hour, minute] = time.split(":").map(Number);
	const suffix = hour < 12 ? "am" : "pm";
	const hour12 = hour % 12 || 12;
	return minute === 0 ? `${hour12}${suffix}` : `${hour12}:${String(minute).padStart(2, "0")}${suffix}`;
}

/** For the contact page's `<dl>`: `[{ days: "Mon–Thu", hours: "8:30am–4pm" }, ...]`. */
export const displayHours = hours.map((entry) => ({
	days: entry.label,
	hours: `${formatTime(entry.opens)}–${formatTime(entry.closes)}`,
}));

/** For the NGO structured data in `Layout.astro`. */
export const openingHoursSpecification = hours.map((entry) => ({
	"@type": "OpeningHoursSpecification",
	dayOfWeek: entry.days,
	opens: entry.opens,
	closes: entry.closes,
}));
