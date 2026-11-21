// /letter/confirm: the button POSTs the token to letter-confirm (Content-Type only, like the sign-up form), then goes to the
// result page. Without JavaScript the form posts itself and the function redirects.
(function () {
  "use strict";
  var form = document.getElementById("confirm-form");
  if (!form) return;
  var btn = document.getElementById("confirm-btn");
  var statusEl = document.getElementById("confirm-status");
  function reset(text) { statusEl.textContent = text; btn.disabled = false; btn.textContent = "Confirm my email"; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Confirming…";
    statusEl.textContent = "";
    fetch(form.getAttribute("action"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: form.elements.t.value })
    }).then(function (res) {
      if (!res.ok) { reset("Something went wrong on our side. Try again in a minute."); return null; }
      return res.json();
    }).then(function (data) {
      if (!data) return;
      location.assign(data.status === "confirmed" ? "/letter/confirmed" : "/letter/expired");
    }).catch(function () {
      reset("We couldn't reach the server. Check your connection and try again.");
    });
  });
})();
