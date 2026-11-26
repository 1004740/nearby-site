# site/: the live landing page

This folder is the landing page that is live on dearborough.london. It was deployed to Cloudflare Pages (project `dearborough`, Production) on 26 November 2026 at 13:20.

It is a self-contained static site: `index.html` (landing page and Supabase waitlist form), `privacy.html` (waitlist privacy notice) and `assets/` (self-hosted Inter fonts and images). There is no build step.

## Where it came from

The files were taken from the live site, because the original upload was only on the owner's computer. Cloudflare's email obfuscation was undone, so `hello@dearborough.london` is a plain `mailto:` link again.

Not recoverable from the live site, so not here: any `_headers` or `_routes.json` that the uploaded build had. Cloudflare doesn't serve those files.

## Deploying

Zip the **contents** of this folder (so `index.html` is at the top level of the zip). Then in Cloudflare: Workers & Pages, `dearborough`, Create deployment, Production, upload the zip, Save and deploy.

## Not included yet

The repository root still holds the earlier site: the Letter sign-up, `/letter/confirm`, `list.html`, the story Functions and `_headers`. The live deployment does not include them. Restore `/letter/confirm` before any Letter confirmation emails go out.
