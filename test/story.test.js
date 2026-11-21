import { test } from "node:test";
import assert from "node:assert/strict";
import { renderPage } from "../functions/_lib/story.js";

const cfg = { siteUrl: "https://dearborough.london", supabaseUrl: "https://x.supabase.co", anonKey: "k" };
const id = "123e4567-e89b-12d3-a456-426614174000";
const now = new Date("2026-11-21T10:00:00Z");
const base = { title: "Romford <b>market</b>", summary: "", source: "Havering Council", source_url: "https://www.havering.gov.uk/x?a=1&b=2", closes_at: null, starts_at: null, venue: null, status: "open" };

test("escapes fetched text and builds the source line", () => {
  const h = renderPage({ type: "s", id, s: { ...base, title: '"><script>x</script>' }, cfg, now });
  assert.ok(!h.includes("<script>x"));
  assert.ok(h.includes("From Havering Council · "));
  assert.ok(h.includes("Read on Havering Council"));
  assert.ok(h.includes("a=1&amp;b=2"));
});

test("open consultation shows the closing date", () => {
  const h = renderPage({ type: "c", id, s: { ...base, closes_at: "2026-12-08T12:00:00Z" }, cfg, now });
  assert.ok(h.includes("Closes Tue 8 Dec"));
  assert.ok(h.includes(`og?type=c&amp;id=${id}`));
  assert.ok(h.includes(`href="https://dearborough.london/c/${id}"`));
});

test("closed consultation", () => {
  const h = renderPage({ type: "c", id, s: { ...base, status: "closed", closes_at: "2026-11-10T12:00:00Z" }, cfg, now });
  assert.ok(h.includes("This consultation closed on Tue 10 Nov"));
  assert.ok(h.includes("Open consultations"));
  assert.ok(!h.includes("Closes "));
});

test("cancelled event", () => {
  const h = renderPage({ type: "e", id, s: { ...base, status: "cancelled", starts_at: "2026-11-28T19:30:00Z", venue: "Romford Library" }, cfg, now });
  assert.ok(h.includes("Havering Council says this event is cancelled."));
  assert.ok(h.includes("Sat 28 Nov, 7:30pm"));
  assert.ok(h.includes("Romford Library"));
});

test("removed and unknown never 404 and say so", () => {
  for (const s of [{ status: "removed" }, null]) {
    const h = renderPage({ type: "s", id, s, cfg, now });
    assert.ok(h.includes("This item is no longer listed."));
    assert.ok(h.includes("See what&#39;s new in Havering") || h.includes("See what's new in Havering"));
    assert.ok(h.includes("noindex"));
    assert.ok(!h.includes("Get deadline reminders"));
  }
});

test("live pages offer the waitlist; no app link until the app can open it; forms post, never get", () => {
  const h = renderPage({ type: "s", id, s: base, cfg, now });
  assert.ok(h.includes("Get deadline reminders in the app"));
  assert.ok(!h.includes("dearborough://"));
  assert.ok(!h.includes("Open in the app"));
  assert.ok(/<form [^>]*method="post"/.test(h));
  assert.ok(h.includes('<script src="/assets/forms.js"></script>'));
  assert.ok(h.includes("<p class=\"kicker\">Update</p>"));
  assert.ok(h.includes('data-from="/s/' + id + '"'));
});

import { handleStory } from "../functions/_lib/story.js";
test("handleStory: backend down gives a friendly page, bad id gives the removed page", async () => {
  const env = { SITE_URL: "https://s.test", SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k" };
  const ctx = (i) => ({ params: { id: i }, env, request: new Request("https://s.test/s/" + i) });
  const real = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("no", { status: 500 });
    const down = await handleStory("s", ctx(id));
    assert.equal(down.status, 503);
    assert.ok((await down.text()).includes("We couldn't load this item"));
    const bad = await handleStory("s", ctx("nope"));
    assert.equal(bad.status, 200);
    assert.ok((await bad.text()).includes("no longer listed"));
    globalThis.fetch = async (u, o) => {
      assert.ok(String(u).includes(`story?type=s&id=${id}`));
      return Response.json({ ...base, type: "s", id });
    };
    const ok = await handleStory("s", ctx(id));
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get("Cache-Control"), "public, max-age=300");
  } finally { globalThis.fetch = real; }
});

test("a consultation whose closing date is unknown is open with no date line and no 'closed' wording", () => {
  const h = renderPage({ type: "c", id, s: { ...base, status: "open", closes_at: null }, cfg, now });
  assert.ok(!h.includes("has closed") && !h.includes("closed on"));
  assert.ok(!h.includes("Closes "));
  assert.ok(!h.includes('class="deadline"'));
  assert.ok(h.includes("Get deadline reminders in the app"));
});

test("a finished event says so and offers no waitlist", () => {
  const h = renderPage({ type: "e", id, s: { ...base, status: "closed", starts_at: "2026-11-10T19:30:00Z", venue: "Romford Library" }, cfg, now });
  assert.ok(h.includes("This event has finished."));
  assert.ok(!h.includes("Get deadline reminders"));
  assert.ok(!h.includes("<form"));
  const live = renderPage({ type: "e", id, s: { ...base, status: "open", starts_at: "2026-11-28T19:30:00Z" }, cfg, now });
  assert.ok(!live.includes("This event has finished."));
});

test("story pages show the publisher name given by the backend, and the fetch sends no key", async () => {
  const env = { SITE_URL: "https://s.test", SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon-secret" };
  const real = globalThis.fetch;
  let seen;
  try {
    globalThis.fetch = async (u, o) => { seen = o; return Response.json({ ...base, source: "Transport for London", source_url: "https://tfl.gov.uk/x" }); };
    const res = await handleStory("s", { params: { id }, env, request: new Request("https://s.test/s/" + id) });
    const text = await res.text();
    assert.ok(text.includes("From Transport for London"));
    assert.ok(!JSON.stringify(seen).includes("anon-secret"));
    assert.equal(seen.headers.apikey, undefined);
    assert.equal(seen.headers.Authorization, undefined);
  } finally { globalThis.fetch = real; }
});
