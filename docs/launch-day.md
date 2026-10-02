# Launch day - pointing soupertroopers.org at the new site

Prepared 2 October 2026 for a soft launch on Monday 5 October. No announcement: the address simply
starts showing the new site.

The code side is ready on the `launch` branch (indexing on, the real address everywhere, robots.txt
and llms.txt switched over, per-page noindex where the blanket used to cover it). The redirects from
the old site's addresses are already live on `main`. **Merge `launch` into `main` only after the
DNS change below has been made** - before that, it would tell Google the site lives at an address
still serving the old WordPress site.

## Before Monday - Stephen

1. **Add the domain in Netlify** (Domain management -> Add a domain): `soupertroopers.org`, and let it
   add `www.soupertroopers.org` too. Make `soupertroopers.org` the **primary** domain, so `www` and the
   netlify.app preview address both redirect to it. Adding it before DNS changes is harmless.
2. **Copy the exact DNS values Netlify shows** for the two records. Normally:
   - `soupertroopers.org` - an **A** record to Netlify's load balancer (`75.2.60.5`)
   - `www.soupertroopers.org` - a **CNAME** to `souper-troopers.netlify.app`

   Use what Netlify shows if it differs.
3. **Shop payments**: check `PAYFAST_MODE` in Netlify's environment variables. Not `live` means the
   shop checkout is still in test mode. If the live merchant details can't be in place, say so and
   Add to cart gets hidden for the launch.
4. **Analytics**: add `soupertroopers.org` as a site in Cloudflare Web Analytics and pass on the new
   token - the current one is scoped to the preview address. (It can follow launch; nothing breaks
   without it, the numbers just don't record.)
5. **Contact form emails**: Site configuration -> Forms -> Form notifications - confirm they go to an
   inbox someone reads.

## On the day - what HostFaddy changes

Send them the two values from step 2, with these four points:

- Change **only** the `soupertroopers.org` (apex) and `www` records to those values.
- Set both to **DNS only** (the grey cloud in Cloudflare, not orange). Netlify issues the site's
  security certificate itself and can't while Cloudflare sits in front.
- **Leave every other record exactly as it is** - above all the email ones: the MX records
  (`mx.spamexperts.com` and the others), the SPF record (`include:spf.antispamcloud.com`) and the
  `google-site-verification` record. Email is not moving; Webtimes keeps running it.
- Tell us when it's done.

## After HostFaddy's change

1. Wait until `dig +short soupertroopers.org` shows Netlify's address, and Netlify's Domain
   management shows HTTPS as active (minutes, occasionally up to an hour).
2. **Merge `launch` into `main`** and push - one production deploy.
3. Check:
   - `https://soupertroopers.org` and `https://www.soupertroopers.org` both load the new site, the
     second redirecting to the first, with a padlock.
   - A few old addresses redirect: `/about-us/`, `/contact-us/`, `/product/african-worry-dolls-per-doll/`.
   - `/robots.txt` allows crawling and names the soupertroopers.org sitemap.
   - Send one message through the contact form; do one real newsletter sign-up.
   - **Email still works**: send a test email to an @soupertroopers.org address and get a reply.
   - The status page still asks for the login at the new address.
   - Look at it on a real iPhone in Safari.
4. Tell Kerry and Shan it's live. Some people will see the old site for a few hours while their
   internet provider's cached copy of the old address expires.

## Afterwards

- Whoever owns the existing Google Search Console verification for soupertroopers.org submits
  `https://soupertroopers.org/sitemap-index.xml`.
- The Studio's Publish button now points at soupertroopers.org; the Studio redeploys itself when the
  merge reaches `main` (the workflow runs on changes under `studio/`).
- Keep Webtimes for a month or two (they run the email and possibly the domain renewal), then decide
  what to keep. The old WordPress site stays on their server until then, untouched.

## If something goes wrong

HostFaddy puts the two records back to their old values and the old site returns. Nothing else
changes, email never moved, and `main` can be reverted with one commit if needed.
