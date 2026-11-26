// /letter/confirm?t=<token>: the page the Letter confirmation email links to.
// Opening the page never confirms anything (mail scanners open links). Only the button does: it POSTs the token to the
// letter-confirm Edge Function, then goes to /letter/confirmed or /letter/expired. If that request fails for any reason
// (network, CORS, error reply), the form posts itself instead, and the function answers with a 303 to the same pages.
(function () {
  "use strict";
  var TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/;
  var token = new URLSearchParams(location.search).get("t") || "";
  var ready = document.getElementById("ready");
  var bad = document.getElementById("bad-link");

  if (!TOKEN_RE.test(token)) {
    bad.hidden = false;
    return;
  }

  // Keep the token out of the address bar and history once it has been read.
  try { history.replaceState(null, "", location.pathname); } catch (e) { /* not important */ }

  var form = document.getElementById("confirm-form");
  var btn = document.getElementById("confirm-btn");
  var statusEl = document.getElementById("confirm-status");
  document.getElementById("confirm-token").value = token;
  ready.hidden = false;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (btn.getAttribute("aria-busy") === "true") return;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = "Confirming…";
    statusEl.textContent = "";
    // form.submit() does not fire "submit" again, so this cannot loop.
    function fallback() { form.submit(); }
    fetch(form.getAttribute("action"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: token })
    }).then(function (res) {
      if (!res.ok) throw new Error("status " + res.status);
      return res.json();
    }).then(function (data) {
      location.assign(data && data.status === "confirmed" ? "/letter/confirmed" : "/letter/expired");
    }).catch(fallback);
  });
})();
