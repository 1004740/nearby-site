// The Letter sign-up (N8). Posts to the letter-subscribe Edge Function. Needs a Turnstile check.
(function () {
  "use strict";
  var F = window.DBForms;
  var CONSENT_VERSION = "letter-2026-11";
  var form = document.getElementById("letter-form");
  if (!form) return;
  var btn = document.getElementById("letter-btn");
  var statusEl = document.getElementById("letter-status");
  var done = document.getElementById("letter-done");
  var siteKey = F.cfg.turnstileSiteKey;
  var widgetId = null, token = "";

  function say(text) { statusEl.textContent = text; }

  if (!F.isOpen() || !siteKey) {
    document.getElementById("closed").hidden = false;
    Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
    return;
  }

  // Load Cloudflare Turnstile and draw the check in explicit mode.
  window.onTurnstileLoad = function () {
    widgetId = window.turnstile.render("#turnstile", {
      sitekey: siteKey,
      callback: function (t) { token = t; F.setErr(form, "turnstile", ""); },
      "expired-callback": function () { token = ""; },
      "error-callback": function () { token = ""; say("The check didn't load. Reload the page and try again."); }
    });
  };
  var s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
  s.async = true; s.defer = true;
  document.head.appendChild(s);

  form.elements.email.addEventListener("input", function () { F.setErr(form, "email", ""); });
  form.elements.consent.addEventListener("change", function () { F.setErr(form, "consent", ""); });

  function resetCheck() {
    token = "";
    if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.elements.email.value.trim();
    var bad = null;
    F.setErr(form, "email", ""); F.setErr(form, "consent", ""); F.setErr(form, "turnstile", ""); say("");

    if (!F.emailOk(email)) { F.setErr(form, "email", "Enter an email address, like you@example.com."); bad = bad || "email"; }
    if (!form.elements.consent.checked) { F.setErr(form, "consent", "Tick the box so we can email you the Letter."); bad = bad || "consent"; }
    if (!token) { F.setErr(form, "turnstile", "Complete the check, then send again."); bad = bad || "none"; }
    if (bad) { if (bad !== "none") form.elements[bad].focus(); return; }

    btn.disabled = true;
    btn.textContent = "Sending…";
    fetch(F.supabaseUrl + "/functions/v1/letter-subscribe", {
      method: "POST",
      headers: F.headers(),
      body: JSON.stringify({ email: email, consent: true, consent_version: CONSENT_VERSION, turnstile_token: token, source_path: location.pathname })
    }).then(function (res) {
      if (res.ok) {
        form.hidden = true;
        done.hidden = false;
        done.focus();
        return;
      }
      resetCheck();
      if (res.status === 400) say("We couldn't sign you up. Check your email address and the box, then try again.");
      else if (res.status === 429) say("Too many tries. Wait a few minutes, then try again.");
      else say("Something went wrong on our side. Try again in a few minutes.");
    }).catch(function () {
      resetCheck();
      say("We couldn't reach the server. Check your connection and try again.");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Send me the Letter";
    });
  });
})();
