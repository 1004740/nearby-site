# site/: the live landing page

This folder is the landing page that is live on dearborough.london. It was deployed to Cloudflare Pages (project `dearborough`, Production) on 26 November 2026 at 13:20.

It is a self-contained static site: `index.html` (landing page and Supabase waitlist form), `privacy.html` (waitlist privacy notice) and `assets/` (self-hosted Inter fonts and images). There is no build step.

## Where it came from

The files were taken from the live site, because the original upload was only on the owner's computer. Cloudflare's email obfuscation was undone, so `hello@dearborough.london` is a plain `mailto:` link again.

Not recoverable from the live site, so not here: any `_headers` or `_routes.json` that the uploaded build had. Cloudflare doesn't serve those files.

## Deploying

Zip the **contents** of this folder (so `index.html` is at the top level of the zip). Then in Cloudflare: Workers & Pages, `dearborough`, Create deployment, Production, upload the zip, Save and deploy.

## Letter email pages

The Edge Functions send people to these pages (`SITE_URL` + path):

| Path | File | What it does |
| --- | --- | --- |
| `/letter/confirm?t=` | `letter/confirm.html`, `assets/letter-confirm.js` | The link in the confirmation email. Opening it changes nothing (mail scanners open links). The button POSTs the token to the `letter-confirm` Edge Function, then goes to the result page. If that request fails, the form posts itself and the function redirects. A bad token shows "This link has expired". The token is removed from the address bar once read. |
| `/letter/confirmed` | `letter/confirmed.html` | After a confirmation |
| `/letter/expired` | `letter/expired.html` | Token unknown or older than 7 days |
| `/letter/unsubscribed` | `letter/unsubscribed.html` | After the unsubscribe link |

They are plain pages, not a Pages Function, because Cloudflare does not run `functions/` from a zip uploaded in the dashboard. The `letter-confirm` URL (production project) is written into `confirm.html`, like the waitlist URL in `index.html`. Styles: `assets/letter.css`.

Before any Letter email goes out, production also needs the Edge Function secrets `SITE_URL` (`https://dearborough.london`, also the CORS origin), `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `LETTER_FROM`, `LETTER_HASH_SALT` and `TURNSTILE_SECRET`, a Letter sign-up form, and the privacy notice extended to cover the Letter.

## Not included yet

The repository root still holds the earlier site: the Letter sign-up page, `list.html`, the story pages for shared links (`/s`, `/c`, `/e`, Pages Functions) and `_headers`. The live deployment does not include them. The story pages need Wrangler (or Git) deploys, not a dashboard zip upload. The old `_headers` content policy blocks inline styles and scripts, which the new landing page uses, so it can't be copied over as it is.
