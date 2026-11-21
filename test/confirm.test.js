import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderConfirmPage, handleConfirm } from "../functions/_lib/confirm.js";
import { SECURITY_HEADERS } from "../functions/_lib/headers.js";

const TOKEN = "abcDEF123_-abcDEF123_-abcDEF123_-abcDEF1";
const cfg = { siteUrl: "https://s.test", supabaseUrl: "https://x.supabase.co", anonKey: "" };
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("confirm page: heading, button, and a no-JS form posting the token to letter-confirm", () => {
  const html = renderConfirmPage({ token: TOKEN, cfg });
  assert.match(html, /<h1>Confirm your email<\/h1>/);
  assert.match(html, />Confirm my email<\/button>/);
  assert.match(html, /<form id="confirm-form" method="post" action="https:\/\/x\.supabase\.co\/functions\/v1\/letter-confirm">/);
  assert.match(html, /<input type="hidden" name="t" value="abcDEF123_-abcDEF123_-abcDEF123_-abcDEF1">/);
  assert.match(html, /src="\/assets\/confirm\.js"/);
  assert.match(html, /name="robots" content="noindex"/);
});

test("confirm page: a missing or malformed token shows the expired page, never a form (and never echoes the input)", () => {
  for (const t of [null, "", "short", `${TOKEN}"><script>alert(1)</script>`]) {
    const html = renderConfirmPage({ token: t, cfg });
    assert.match(html, /That link has expired/);
    assert.equal(html.includes("<form"), false);
    assert.equal(html.includes("<script>alert"), false);
  }
});

test("confirm page: no Supabase URL set shows a plain notice, no form", () => {
  const html = renderConfirmPage({ token: TOKEN, cfg: { ...cfg, supabaseUrl: "" } });
  assert.equal(html.includes("<form"), false);
  assert.match(html, /isn't available right now/);
});

test("GET /letter/confirm is a plain page: no store, no referrer, security headers, no network call", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("must not fetch"); };
  try {
    const res = await handleConfirm({ env: { SITE_URL: "https://s.test", SUPABASE_URL: "https://x.supabase.co" }, request: new Request(`https://s.test/letter/confirm?t=${TOKEN}`) });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    assert.equal(res.headers.get("Referrer-Policy"), "no-referrer");
    assert.match(res.headers.get("Content-Security-Policy"), /form-action 'self' https:\/\/\*\.supabase\.co/);
    for (const k of Object.keys(SECURITY_HEADERS)) assert.ok(res.headers.get(k), k);
  } finally { globalThis.fetch = real; }
});

test("confirm.js posts JSON with Content-Type only and routes to the result pages; _routes runs the function", () => {
  const js = read("assets/confirm.js");
  assert.match(js, /headers: \{ "Content-Type": "application\/json" \}/);
  assert.equal(/apikey|Authorization/i.test(js), false);
  assert.match(js, /\/letter\/confirmed/);
  assert.match(js, /\/letter\/expired/);
  assert.ok(JSON.parse(read("_routes.json")).include.includes("/letter/confirm"));
});
