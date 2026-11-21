// Pure helpers for the story pages. No dependencies, so Node can test them (see /test).

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape any text before it goes into HTML, including attribute values. */
export function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

const TYPES = { s: "story", c: "consultation", e: "event" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isType(t) { return Object.prototype.hasOwnProperty.call(TYPES, t); }
export function isUuid(id) { return UUID.test(String(id || "")); }

/** Only http(s) links are ever rendered as links. */
export function safeUrl(u) {
  try {
    const url = new URL(String(u));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch (e) { return ""; }
}

function parts(date, opts) {
  const out = {};
  for (const p of new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...opts }).formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** "Tue 8 Dec", in London time whatever the server's zone. Empty string for a missing or bad date. */
export function formatDay(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return "";
  const p = parts(d, { weekday: "short", day: "numeric", month: "short" });
  return `${p.weekday} ${p.day} ${p.month}`;
}

/** "7:30pm", or "" when the time is exactly midnight in London (a date with no time). */
export function formatTime(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return "";
  const p = parts(d, { hour: "numeric", minute: "2-digit", hourCycle: "h23" });
  const h = Number(p.hour), m = p.minute;
  if (h === 0 && m === "00") return "";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m === "00" ? "" : ":" + m}${h < 12 ? "am" : "pm"}`;
}

/** A consultation is closed if the feed says so or the closing date has passed (the feed is cached for 5 minutes). */
export function isClosed(story, now = new Date()) {
  if (story.status === "closed") return true;
  if (story.closes_at) {
    const c = new Date(story.closes_at);
    if (!isNaN(c) && c < now) return true;
  }
  return false;
}

/** Read `key: "value"` pairs from the text of config.js, so the site has one place for settings. */
export function parseConfigJs(text) {
  const out = {};
  const re = /([A-Za-z_]+)\s*:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(String(text || "")))) out[m[1]] = m[2];
  return out;
}

/** Short plain text for meta descriptions. */
export function clip(text, max = 160) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}
