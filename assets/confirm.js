// /letter/confirm: the button POSTs the token to letter-confirm (Content-Type only, like the sign-up form), then goes to the
// result page. Without JavaScript the form posts itself and the function redirects.
(function () {
  "use strict";
  var form = document.getElementById("confirm-form");
  if (!form) return;
  var btn = document.getElementById("confirm-btn");
  var statusEl = document.getElementById("confirm-status");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Confirming…";
    statusEl.textContent = "";
    // Any failure (network, CORS, non-2xx, unreadable reply) falls back to the plain form post, which needs no CORS and
    // ends in the function's redirect. form.submit() does not fire "submit" again, so this cannot loop.
    function fallback() { statusEl.textContent = "Confirming…"; form.submit(); }
    fetch(form.getAttribute("action"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: form.elements.t.value })
    }).then(function (res) {
      if (!res.ok) throw new Error("status " + res.status);
      return res.json();
    }).then(function (data) {
      location.assign(data && data.status === "confirmed" ? "/letter/confirmed" : "/letter/expired");
    }).catch(fallback);
  });
})();
