// Small helpers shared by the sign-up forms. Plain JS, no dependencies.
(function () {
  "use strict";
  var cfg = window.DB_CONFIG || {};
  function trimSlash(u) { return String(u || "").replace(/\/$/, ""); }
  window.DBForms = {
    cfg: cfg,
    supabaseUrl: trimSlash(cfg.supabaseUrl),
    isOpen: function () { return !!(cfg.supabaseUrl && cfg.supabaseAnonKey); },
    emailOk: function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254; },
    // The first half of a UK postcode. "" if blank, null if it isn't a postcode.
    outcodeOf: function (value) {
      var v = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!v) return "";
      var full = v.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
      if (full) return full[1];
      return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(v) ? v : null;
    },
    setErr: function (form, name, text) {
      var input = form.elements[name], out = document.getElementById(name + "-err");
      if (out) out.textContent = text || "";
      if (!input) return;
      if (text) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    },
    // For our own Edge Functions (letter-subscribe, story): verify_jwt is false, so no key is sent. Only Content-Type, so the
    // browser's preflight asks for nothing the function's CORS answer does not allow.
    functionHeaders: function () {
      return { "Content-Type": "application/json" };
    },
    // For the waitlist table (PostgREST), which does need the public anon key.
    headers: function () {
      return { "Content-Type": "application/json", apikey: cfg.supabaseAnonKey, Authorization: "Bearer " + cfg.supabaseAnonKey };
    }
  };
})();
