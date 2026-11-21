# Dear Borough website

The public website for Dear Borough: the landing page, the weekly Letter sign-up, the app waitlist, and the pages behind shared links to a story, consultation or event. It runs on Cloudflare Pages (free plan). There is no build step and no npm dependencies.

## What is here

| Path | What it is |
| --- | --- |
| `index.html` | Landing page and app waitlist form |
| `letter.html` | Letter sign-up (email, unticked consent box, Turnstile check) |
| `letter/confirmed.html`, `expired.html`, `unsubscribed.html` | Where the email links land |
| `list.html` | "You're on the list" after a waitlist sign-up |
| `privacy.html` | Privacy notice (owner placeholders are highlighted) |
| `functions/s/[id].js`, `c/[id].js`, `e/[id].js` | Pages Functions: render a story, consultation or event on the server from the `story` Edge Function |
| `functions/_lib/` | Helpers the functions use (escaping, London dates). Tested in `test/` |
| `assets/` | Brand files (D seal, wordmark, icons), `og-image.png`, CSS and the form scripts |
| `config.js` | Settings: `SITE_URL`, `supabaseUrl`, `supabaseAnonKey`, `turnstileSiteKey` |
| `_headers`, `_routes.json` | Security headers for static files; limits Functions to the story paths |
| `functions/_middleware.js`, `functions/_lib/headers.js` | The same security headers on Function responses (`_headers` does not cover them). A test fails if the two lists differ |
| `.well-known/apple-app-site-association` | Placeholder for universal links |

The contract with the backend (function names, paths, the `story` JSON) is `project/engineering/contracts-web.md` in the app repo.

## Deploying on Cloudflare Pages

1. In the Cloudflare dashboard: **Workers & Pages > Create > Pages > Connect to Git**, and pick this repository.
2. Production branch: `main`. **Build command: leave empty. Build output directory: `/`** (the repository root).
3. Deploy. The site appears at `https://<project>.pages.dev`. Functions in `/functions` are picked up automatically.
4. Optional environment variables (**Settings > Variables and Secrets**). They override `config.js` for the story pages only: `SITE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. The forms in the browser always read `config.js`, so fill that in too.

Publishing the repository root also publishes `README.md`, `test/` and `package.json`. None of it is secret. Move the pages into a `public/` folder later if you'd rather not.

## Turning sign-ups on

1. Deploy the app's database and Edge Functions (see the app README), including the `waitlist` migrations and `letter_subscribers`.
2. In `config.js`, set `supabaseUrl` and the **anon public** key. Both are safe to publish. Set `SITE_URL` to the real domain, and set the same value as the `SITE_URL` secret on the Edge Functions, because they only allow requests from that address.
3. Turnstile: **Cloudflare dashboard > Turnstile > Add widget**, hostname = your domain (and the `*.pages.dev` address while testing), mode Managed. Paste the **site key** into `turnstileSiteKey` in `config.js`. Put the **secret key** in the Edge Function secret `TURNSTILE_SECRET`. Never put the secret in this repository.
4. Commit and push. Pages redeploys.

Until `supabaseUrl`, the anon key and the Turnstile site key are set, the forms are switched off and say sign-ups aren't open yet.

## Domain

The domain isn't bought yet, so `https://dearborough.london` is a placeholder. When you have it:

- Add it under the Pages project's **Custom domains**.
- Change it in `config.js` and in the canonical, `og:url` and `og:image` lines at the top of `index.html`.
- Update the `SITE_URL` secret on the Edge Functions.
- Tighten `https://*.supabase.co` to your project URL if you like, in BOTH `_headers` and `functions/_lib/headers.js` (a test checks they match).

## Universal links (iOS)

`.well-known/apple-app-site-association` is a placeholder. **TODO(owner):** replace `TEAMID` with your Apple Developer Team ID before the app ships. `_headers` serves it as `application/json`. Story pages have no "Open in the app" link yet: it comes back when the app handles `/s`, `/c` and `/e` links. `/letter` is listed so app users who open it land in the app (never offered the email Letter): confirm that is intended.

## Seeing who signed up

- Waitlist: Supabase **Table editor > waitlist**, or `select * from waitlist_by_area;`.
- Letter: `letter_subscribers` (service role only).

## Tests

`npm test` (or `node --test`) runs the tests for the helpers and the story renderer. Node 22 or later, nothing to install.

## Privacy

- Only the first half of a postcode (for example RM1) is ever stored.
- Consent boxes are never ticked for you. The Letter stores the consent wording version and time.
- Fill in the highlighted placeholders in `privacy.html` before going live: who runs Dear Borough, a contact email, the Supabase region, and retention periods.
- The pages use system fonts, so no font service is contacted.

## History

This repository used to hold the Nearby site and, before that, a currency dashboard prototype. Both are in the commit history.
