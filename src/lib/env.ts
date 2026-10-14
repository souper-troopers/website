/**
 * True on Netlify's non-live builds - the `dev` branch deploy (staging, dev--souper-troopers.netlify.app)
 * and pull-request previews - and false on the live site and on a local machine (14 October 2026).
 * Netlify sets CONTEXT at build time: "production", "branch-deploy" or "deploy-preview"; locally it
 * is unset. Drives the "don't index" marker, the Staging strip and the "[STAGING]" label on form
 * messages, so none of them can reach soupertroopers.org.
 */
export const IS_STAGING = !!process.env.CONTEXT && process.env.CONTEXT !== "production";

/** Put in front of anything a staging form sends, so test messages are obvious in the inbox. */
export const STAGING_LABEL = "[STAGING - test, please ignore]";
