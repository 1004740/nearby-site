# Nearby website

The landing page for [Nearby](https://github.com/1004740/nearby), the local news app. It explains what the app does and collects launch sign-ups by postcode district, so you can see which areas to launch in first.

It's one static page: `index.html`, with its settings in `config.js`. There's no build step.

## Turning sign-ups on

The form saves to the `waitlist` table in the app's Supabase database. That table is created by the app repository's `20261109140000_waitlist.sql` migration.

1. Deploy the app's database (see the app README), including that migration.
2. In `config.js`, paste your Supabase project URL and **anon public** key. Both are safe to publish, because the table only lets the public add a sign-up, never read the list.
3. Commit and push.

Until `config.js` is filled in, the form tells visitors that sign-ups aren't open yet.

## Seeing who signed up

In the Supabase dashboard:

- **Table editor → waitlist** shows every sign-up.
- **SQL editor**: `select * from waitlist_by_area;` shows sign-ups per postcode district, busiest first. Use it to choose the launch city.

Only you can read these. The website can only write to them.

## Publishing the site

GitHub Pages can host it for free: **Settings → Pages → Deploy from a branch → `main` / root**. The site appears at `https://1004740.github.io/nearby-site/`. A custom domain can be added on the same page later.

## Privacy

- Only the first half of a postcode (for example M1) is stored, never the full postcode.
- Consent to be emailed is required and stored with each sign-up.
- Before going live, add a privacy notice link that covers the waitlist. It's on the launch checklist in the build plan.

## History

This repository used to hold a currency dashboard prototype (`index-file.html`). It was removed when the repository became the Nearby site, and can still be found in the commit history.
