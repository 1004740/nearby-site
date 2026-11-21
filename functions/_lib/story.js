// Story pages: /s/[id], /c/[id], /e/[id]. Fetches the `story` Edge Function, renders HTML. Never a 404.
import { SECURITY_HEADERS } from "./headers.js";
import { esc, formatDay, formatTime, isClosed, isType, isUuid, safeUrl, parseConfigJs, clip } from "./util.js";

const DEFAULT_SITE = "https://dearborough.london";
const TAGLINE = "Council news, road changes and decisions for your area.";
const KIND = { s: "Update", c: "Consultation", e: "Event" };

/** Settings: Pages environment variables win, then config.js (served from the same site). */
export async function loadConfig(env, requestUrl) {
  let file = {};
  try {
    if (env && env.ASSETS) {
      const res = await env.ASSETS.fetch(new URL("/config.js", requestUrl));
      if (res.ok) file = parseConfigJs(await res.text());
    }
  } catch (e) { /* fall through to defaults */ }
  const e = env || {};
  return {
    siteUrl: (e.SITE_URL || file.SITE_URL || DEFAULT_SITE).replace(/\/$/, ""),
    supabaseUrl: (e.SUPABASE_URL || file.supabaseUrl || "").replace(/\/$/, ""),
    anonKey: e.SUPABASE_ANON_KEY || file.supabaseAnonKey || "",
  };
}

async function fetchStory(cfg, type, id) {
  const url = `${cfg.supabaseUrl}/functions/v1/story?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
  // No key: the story function has verify_jwt = false. Server to server, so CORS does not apply.
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`story ${res.status}`);
  return res.json();
}

function sourceLine(s) {
  const url = safeUrl(s.source_url);
  const name = esc(s.source || "");
  if (!name) return "";
  if (!url) return `<p class="source">From ${name}</p>`;
  return `<p class="source">From ${name} · <a href="${esc(url)}" rel="noopener" target="_blank" aria-label="Read on ${name}, opens in a new tab">Read on ${name} <span aria-hidden="true">↗</span></a></p>`;
}

function body(type, s, now) {
  if (s.status === "removed" || !s.title) {
    return `<h1>This item is no longer listed.</h1>
<div class="actions"><a class="btn" href="/">See what's new in Havering <span aria-hidden="true">›</span></a></div>`;
  }
  const parts = [`<p class="kicker${type === "e" ? " events" : ""}">${KIND[type]}</p>`, `<h1>${esc(s.title)}</h1>`];
  if (type === "c") {
    const day = formatDay(s.closes_at);
    if (isClosed(s, now)) {
      parts.push(`<p>${day ? `This consultation closed on ${esc(day)}` : "This consultation has closed"}</p>`);
      parts.push(`<p><a href="/letter">Open consultations <span aria-hidden="true">›</span></a></p>`);
    } else if (day) {
      parts.push(`<p class="deadline">Closes ${esc(day)}</p>`);
    }
  }
  if (s.summary) parts.push(`<p>${esc(s.summary)}</p>`);
  if (type === "e") {
    if (s.status === "closed") parts.push(`<p class="notice">This event has finished.</p>`);
    if (s.status === "cancelled") {
      parts.push(`<p class="notice">${esc(s.source || "The organiser")} says this event is cancelled.</p>`);
    }
    const day = formatDay(s.starts_at), time = formatTime(s.starts_at);
    const rows = [];
    if (day) rows.push(`<div><dt>Date</dt><dd>${esc(day)}${time ? `, ${esc(time)}` : ""}</dd></div>`);
    if (s.venue) rows.push(`<div><dt>Where</dt><dd>${esc(s.venue)}</dd></div>`);
    if (rows.length) parts.push(`<dl class="facts">${rows.join("")}</dl>`);
  }
  parts.push(sourceLine(s));
  return parts.join("\n");
}

function waitlist(type, id) {
  const path = `/${type}/${id}`;
  return `<section class="block" id="waitlist" aria-labelledby="wl-h">
<div class="panel">
<form id="join-form" method="post" action="/" data-waitlist data-source="story-${type}" data-from="${esc(path)}" novalidate>
<h2 id="wl-h">Get deadline reminders in the app</h2>
<p class="muted">Join the waitlist. We're opening Dear Borough to Havering residents in stages, and we'll email you when it's your turn.</p>
<p class="notice" id="closed" hidden>Sign-ups aren't open yet. Check back soon.</p>
<div class="fieldgroup"><label class="f" for="email">Email address</label>
<input class="field" id="email" name="email" type="email" autocomplete="email" inputmode="email" aria-describedby="email-err">
<p class="err" id="email-err"></p></div>
<div class="fieldgroup"><label class="check" for="consent"><input type="checkbox" id="consent" name="consent" aria-describedby="consent-err"><span>Email me when Dear Borough opens to me. See the <a href="/privacy">privacy notice</a>.</span></label>
<p class="err" id="consent-err"></p></div>
<button class="btn" type="submit">Join the waitlist</button>
<p class="status" role="status" aria-live="polite" data-status></p>
</form>
<noscript><p class="notice">This form needs JavaScript. Turn it on, or <a href="/letter">get the Letter by email</a> instead.</p></noscript>
</div>
<!-- App link left out until the app handles these links. -->
</section>`;
}

/** Whole page. `s` is the story JSON (or null for a bad link). Pure, so Node can test it. */
export function renderPage({ type, id, s, cfg, now = new Date() }) {
  const removed = !s || s.status === "removed" || !s.title;
  const canonical = isType(type) && isUuid(id) ? `${cfg.siteUrl}/${type}/${id}` : cfg.siteUrl + "/";
  const title = removed ? "Dear Borough" : s.title;
  const desc = removed ? TAGLINE : clip(s.summary || (type === "c" && s.closes_at && !isClosed(s, now) ? `Closes ${formatDay(s.closes_at)}. ${TAGLINE}` : TAGLINE));
  const image = !removed && cfg.supabaseUrl
    ? `${cfg.supabaseUrl}/functions/v1/og?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`
    : `${cfg.siteUrl}/assets/og-image.png`;
  const pageTitle = removed ? "This item is no longer listed | Dear Borough" : `${s.title} | Dear Borough`;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(desc)}">
${removed ? '<meta name="robots" content="noindex">' : ""}
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#FCFAF6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#10152B" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Dear Borough">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/site.css">
<script src="/config.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to the content</a>
<div class="wrap">
<header class="bar">
  <a class="brand" href="/" aria-label="Dear Borough, home"><picture><source srcset="/assets/wordmark-cream.svg" media="(prefers-color-scheme: dark)"><img src="/assets/wordmark-ink.svg" alt="Dear Borough" width="170" height="26"></picture></a>
  <nav aria-label="Main"><a href="/letter">Get the Letter</a></nav>
</header>
<main id="main">
${body(type, s || { status: "removed" }, now)}
${removed || (type === "e" && s.status === "closed") ? "" : waitlist(type, id)}
</main>
<footer>
  <a href="/privacy">Privacy notice</a><a href="/letter">Get the Letter</a><a href="/">Home</a>
  <p>Dear Borough summarises public information and links to the original. It is not run by Havering Council.</p>
</footer>
</div>
${removed ? "" : '<script src="/assets/forms.js"></script>\n<script src="/assets/waitlist.js"></script>'}
</body>
</html>`;
}

function html(body, status, cache) {
  // _headers does not apply to Pages Functions responses, so the security headers are set here (and in _middleware.js).
  return new Response(body, { status, headers: { ...SECURITY_HEADERS, "Content-Type": "text/html; charset=utf-8", "Cache-Control": cache } });
}

/** Shared by the three route files. */
export async function handleStory(type, context) {
  const id = String(context.params.id || "");
  const cfg = await loadConfig(context.env, context.request.url);
  if (!isType(type) || !isUuid(id)) {
    return html(renderPage({ type, id, s: null, cfg }), 200, "public, max-age=300");
  }
  if (!cfg.supabaseUrl) {
    // Not set up yet: show the removed-style page rather than an error.
    return html(renderPage({ type, id, s: null, cfg }), 200, "no-store");
  }
  let s;
  try {
    s = await fetchStory(cfg, type, id);
  } catch (e) {
    const page = renderPage({ type, id, s: null, cfg }).replace(
      "This item is no longer listed.", "We couldn't load this item. Try again in a minute.");
    return html(page, 503, "no-store");
  }
  return html(renderPage({ type, id, s, cfg }), 200, "public, max-age=300");
}
