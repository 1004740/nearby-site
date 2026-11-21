// Show "Back to the story" only for a same-site story path, never for an arbitrary address.
(function () {
  var from = new URLSearchParams(location.search).get("from") || "";
  var back = document.getElementById("back");
  if (back && /^\/[a-z]\/[0-9a-f-]{36}$/i.test(from)) { back.href = from; back.hidden = false; }
})();
