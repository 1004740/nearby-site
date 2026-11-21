import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, formatDay, formatTime, isClosed, isUuid, isType, safeUrl, parseConfigJs, clip } from "../functions/_lib/util.js";

test("esc escapes markup and quotes", () => {
  assert.equal(esc(`<script>alert("x")</script> & 'y'`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;");
  assert.equal(esc(null), "");
  assert.equal(esc(5), "5");
});

test("formatDay uses London time", () => {
  assert.equal(formatDay("2026-12-08T12:00:00Z"), "Tue 8 Dec");
  // 23:30 UTC in summer is already the next day in London
  assert.equal(formatDay("2026-06-30T23:30:00Z"), "Wed 1 Jul");
  // midnight at the end of winter: London = UTC
  assert.equal(formatDay("2026-12-08T23:59:00Z"), "Tue 8 Dec");
  assert.equal(formatDay(""), "");
  assert.equal(formatDay("nonsense"), "");
});

test("formatTime", () => {
  assert.equal(formatTime("2026-11-28T19:30:00Z"), "7:30pm");
  assert.equal(formatTime("2026-11-28T10:00:00Z"), "10am");
  assert.equal(formatTime("2026-11-28T00:00:00Z"), "");
  assert.equal(formatTime("2026-06-28T23:00:00Z"), ""); // midnight BST
  assert.equal(formatTime("2026-11-28T12:05:00Z"), "12:05pm");
});

test("isClosed", () => {
  const now = new Date("2026-11-21T10:00:00Z");
  assert.equal(isClosed({ status: "closed" }, now), true);
  assert.equal(isClosed({ status: "open", closes_at: "2026-11-20T00:00:00Z" }, now), true);
  assert.equal(isClosed({ status: "open", closes_at: "2026-12-08T00:00:00Z" }, now), false);
  assert.equal(isClosed({ status: "open" }, now), false);
});

test("ids, types and urls", () => {
  assert.ok(isUuid("123e4567-e89b-12d3-a456-426614174000"));
  assert.ok(!isUuid("../etc/passwd"));
  assert.ok(isType("c") && !isType("x") && !isType("constructor"));
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("https://www.havering.gov.uk/a?b=1"), "https://www.havering.gov.uk/a?b=1");
});

test("parseConfigJs", () => {
  const cfg = parseConfigJs('window.DB = { SITE_URL: "https://x.test", supabaseUrl: "", // c\n turnstileSiteKey: "k" };');
  assert.equal(cfg.SITE_URL, "https://x.test");
  assert.equal(cfg.supabaseUrl, "");
  assert.equal(cfg.turnstileSiteKey, "k");
});

test("clip", () => {
  assert.equal(clip("a  b\n c"), "a b c");
  assert.ok(clip("word ".repeat(100), 50).length <= 50);
});
