// The app waitlist form. Adds a row to the `waitlist` table: email, first half of the postcode (optional), consent, source.
(function () {
  "use strict";
  var F = window.DBForms;
  var form = document.querySelector("form[data-waitlist]");
  if (!form) return;
  var btn = form.querySelector("button[type=submit]");
  var statusEl = form.querySelector("[data-status]");
  var label = btn.textContent;
  var source = form.getAttribute("data-source") || "landing";
  var from = form.getAttribute("data-from") || "";

  if (!F.isOpen()) {
    var closed = document.getElementById("closed");
    if (closed) closed.hidden = false;
    Array.prototype.forEach.call(form.elements, function (el) { el.disabled = true; });
    return;
  }

  ["email", "postcode", "consent"].forEach(function (n) {
    var el = form.elements[n];
    if (el) el.addEventListener(n === "consent" ? "change" : "input", function () { F.setErr(form, n, ""); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.elements.email.value.trim();
    var pcField = form.elements.postcode;
    var outcode = pcField ? F.outcodeOf(pcField.value) : "";
    var bad = [];
    ["email", "postcode", "consent"].forEach(function (n) { F.setErr(form, n, ""); });
    statusEl.textContent = "";

    if (!F.emailOk(email)) { F.setErr(form, "email", "Enter an email address, like you@example.com."); bad.push("email"); }
    if (outcode === null) { F.setErr(form, "postcode", "Enter a UK postcode, like RM1 3AB, or leave it blank."); bad.push("postcode"); }
    if (!form.elements.consent.checked) { F.setErr(form, "consent", "Tick the box so we can email you when it's your turn."); bad.push("consent"); }
    if (bad.length) { form.elements[bad[0]].focus(); return; }

    btn.disabled = true;
    btn.textContent = "Joining…";
    var h = F.headers();
    h.Prefer = "return=minimal";
    fetch(F.supabaseUrl + "/rest/v1/waitlist", {
      method: "POST",
      headers: h,
      body: JSON.stringify({ email: email, outcode: outcode || null, consent: true, source: source })
    }).then(function (res) {
      // 409 means this email is already on the list, which is fine.
      if (res.ok || res.status === 409) {
        var to = "/list";
        if (/^\/[a-z]\/[0-9a-f-]{36}$/i.test(from)) to += "?from=" + encodeURIComponent(from);
        window.location.assign(to);
        return;
      }
      throw new Error("status " + res.status);
    }).catch(function (err) {
      var offline = err && err.message && err.message.indexOf("status") !== 0;
      statusEl.textContent = offline
        ? "We couldn't reach the server. Check your connection and try again."
        : "That didn't go through. Try again in a minute.";
      btn.disabled = false;
      btn.textContent = label;
    });
  });
})();
