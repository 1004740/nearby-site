// /letter/confirm?t=<token>: the page the confirmation email links to. Mail scanners open links, so opening this page never
// confirms anything: only the button (a POST to the letter-confirm Edge Function) does. With JavaScript off, the same button is a
// plain form post, which the function answers with a 303 to /letter/confirmed or /letter/expired.
// A Pages Function (not a static file) so the form's action can carry the project's Supabase URL.
import { SECURITY_HEADERS } from "./headers.js";
import { esc } from "./util.js";
import { loadConfig } from "./story.js";

export const TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/;

const SHELL = (title, inner, script) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FCFAF6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#10152B" media="(prefers-color-scheme: dark)">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/site.css">
<title>${esc(title)} | Dear Borough</title>
</head>
<body>
<a class="skip" href="#main">Skip to the content</a>
<div class="wrap wide">
<header class="bar">
  <a class="brand" href="/" aria-label="Dear Borough, home"><picture><source srcset="/assets/wordmark-cream.svg" media="(prefers-color-scheme: dark)"><img src="/assets/wordmark-ink.svg" alt="Dear Borough" width="170" height="26"></picture></a>
  <nav aria-label="Main"><a href="/letter">Get the Letter</a></nav>
</header>
<main id="main">
${inner}
</main>
<footer>
  <a href="/privacy">Privacy notice</a><a href="/letter">Get the Letter</a><a href="/">Home</a>
  <p>Dear Borough summarises public information and links to the original. It is not run by Havering Council.</p>
</footer>
</div>
${script ? '<script src="/assets/confirm.js"></script>' : ""}
</body>
</html>`;

/** The whole page. `token` is null or malformed for a bad link; `cfg.supabaseUrl` empty means sign-ups are not set up. Pure. */
export function renderConfirmPage({ token, cfg }) {
  if (!token || !TOKEN_RE.test(token)) {
    return SHELL("That link has expired", `<h1>That link has expired.</h1>
<p class="lede">Sign up again and we'll send a new one.</p>
<div class="actions"><a class="btn" href="/letter">Get the weekly Letter by email</a></div>`, false);
  }
  if (!cfg.supabaseUrl) {
    return SHELL("Confirm your email", `<h1>Confirm your email</h1>
<p class="notice">This isn't available right now. Please try the link again later.</p>`, false);
  }
  const action = `${cfg.supabaseUrl}/functions/v1/letter-confirm`;
  return SHELL("Confirm your email", `<h1>Confirm your email</h1>
<p class="lede">One more step to start the weekly Havering Letter.</p>
<div class="panel">
  <form id="confirm-form" method="post" action="${esc(action)}">
    <input type="hidden" name="t" value="${esc(token)}">
    <button class="btn" type="submit" id="confirm-btn">Confirm my email</button>
    <p class="status err" id="confirm-status" role="status" aria-live="polite"></p>
  </form>
</div>
<p class="muted">If this wasn't you, close this page. Nothing will be sent.</p>`, true);
}

/** GET /letter/confirm. Never talks to the database; changes nothing. */
export async function handleConfirm(context) {
  const cfg = await loadConfig(context.env, context.request.url);
  const token = new URL(context.request.url).searchParams.get("t");
  return new Response(renderConfirmPage({ token, cfg }), {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      "Referrer-Policy": "no-referrer", // the token is in the address
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
