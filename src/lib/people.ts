/**
 * The named people who use the internal update page.
 *
 * A short, known list rather than a free-text field: everyone who will ever touch these controls is
 * already known, and a text box for a two-person audience invites typos, blanks and "me" — none of
 * which we can act on later. Kept here rather than inline so that anything else added to that page
 * (a comment thread, an approval) attributes to the same spellings.
 */

/** Souper Troopers' side — the only people who can mark one of their own tasks done. */
export const clientPeople = ["Kerry", "Shan"] as const;

/** Everyone working on the site. Not used by "Mark as done", which is deliberately client-only. */
export const projectPeople = ["Adrian", "Brad", "Stephen"] as const;

export type Person = (typeof clientPeople)[number] | (typeof projectPeople)[number];
