import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SECURITY_HEADERS, withSecurityHeaders } from "../functions/_lib/headers.js";
import { handleStory } from "../functions/_lib/story.js";
import { onRequest } from "../functions/_middleware.js";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const id = "123e4567-e89b-12d3-a456-426614174000";

test("Function security headers match the /* block of _headers exactly", () => {
  const block = read("_headers").split("\n").slice(read("_headers").split("\n").indexOf("/*") + 1);
  const fromFile = {};
  for (const line of block) {
    if (!/^\s+\S/.test(line)) break;
    const i = line.indexOf(":");
    fromFile[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  assert.deepEqual(SECURITY_HEADERS, fromFile);
});

test("story pages carry the security headers, on success, removed and error pages", async () => {
  const env = { SITE_URL: "https://s.test", SUPABASE_URL: "https://x.supabase.co" };
  const real = globalThis.fetch;
  try {
    for (const [fetchImpl, i] of [
      [async () => Response.json({ status: "open", title: "T", source: "Havering Council" }), id],
      [async () => new Response("no", { status: 500 }), id],
      [async () => Response.json({}), "not-an-id"],
    ]) {
      globalThis.fetch = fetchImpl;
      const res = await handleStory("s", { params: { id: i }, env, request: new Request("https://s.test/s/" + i) });
      for (const k of Object.keys(SECURITY_HEADERS)) assert.ok(res.headers.get(k), `${k} on ${res.status}`);
      assert.match(res.headers.get("Content-Security-Policy"), /frame-ancestors 'none'/);
    }
  } finally { globalThis.fetch = real; }
});

test("middleware adds the headers to any response and keeps ones already set; a thrown error still gets them", async () => {
  const res = await onRequest({ next: async () => new Response("x", { status: 404, headers: { "X-Content-Type-Options": "custom" } }) });
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("X-Content-Type-Options"), "custom");
  assert.equal(res.headers.get("Strict-Transport-Security"), SECURITY_HEADERS["Strict-Transport-Security"]);
  const failed = await onRequest({ next: async () => { throw new Error("boom"); } });
  assert.equal(failed.status, 500);
  assert.ok(failed.headers.get("Content-Security-Policy"));
  assert.equal(withSecurityHeaders(new Response("y")).headers.get("Referrer-Policy"), SECURITY_HEADERS["Referrer-Policy"]);
});

test("every form on the site posts (data never lands in a URL) and the landing page loads forms.js before waitlist.js", () => {
  for (const file of ["index.html", "letter.html", "functions/_lib/story.js"]) {
    const forms = read(file).match(/<form\b[^>]*>/g) || [];
    assert.ok(forms.length > 0, file);
    for (const f of forms) assert.match(f, /method="post"/, `${file}: ${f}`);
  }
  const index = read("index.html");
  const forms = index.indexOf('src="/assets/forms.js"');
  const wait = index.indexOf('src="/assets/waitlist.js"');
  assert.ok(forms > 0 && wait > forms, "forms.js must load first");
});

test("scripts that use forms.js are served it; the letter form sends only Content-Type to the function", () => {
  for (const file of ["index.html", "letter.html"]) assert.ok(read(file).includes('src="/assets/forms.js"'), file);
  const letter = read("assets/letter.js");
  assert.ok(letter.includes("F.functionHeaders()"));
  assert.ok(!letter.includes("F.headers()"));
  const forms = read("assets/forms.js");
  const fn = forms.slice(forms.indexOf("functionHeaders"), forms.indexOf("// For the waitlist table"));
  assert.ok(!/apikey|Authorization/i.test(fn.replace(/\/\/.*$/gm, "")), "no key in function headers");
});

test("the confirmed page promises nothing about quiet weeks", () => {
  assert.ok(read("letter/confirmed.html").includes("Letters go out on Monday mornings."));
  assert.ok(!read("letter/confirmed.html").includes("first Letter arrives"));
});

test("privacy notice states the retention the backend enforces", () => {
  const p = read("privacy.html");
  assert.ok(p.includes("30 days after we send the confirmation email"));
  assert.ok(p.includes("30 days after you unsubscribe"));
  assert.ok(p.includes("within 24 hours of the sign-up request, and at the latest after 7 days"));
  assert.ok(p.includes("hashed"));
  assert.ok(p.includes("Resend is based in the United States"));
});
