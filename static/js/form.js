/* Enquiry form: checks the fields, sends to the Google Apps Script web app,
   then goes to /thank-you/. Works with the page's own script, no libraries. */
(function () {
  var forms = document.querySelectorAll("form.form");
  if (!forms.length) return;
  var ERR = "Something went wrong. Please try again, or message us on WhatsApp.";
  forms.forEach(function (form) {
    var err = form.querySelector(".f-error");
    var btn = form.querySelector("button[type=submit]");
    form.elements.page_url.value = location.href;
    function show(msg, el) {
      err.textContent = msg; err.hidden = false;
      if (el) { el.classList.add("invalid"); el.focus(); }
    }
    form.addEventListener("input", function (e) { e.target.classList.remove("invalid"); err.hidden = true; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      var name = form.elements.name, phone = form.elements.phone, consent = form.elements.consent;
      if (!name.value.trim()) return show("Please enter your name.", name);
      if (phone.value.replace(/\D/g, "").length < 7) return show("Please enter a phone number we can reach you on.", phone);
      if (!consent.checked) return show("Please tick the box so we may contact you.", consent);
      if (form.elements.website_url.value) { location.href = "/thank-you/"; return; } /* bot: pretend it worked */
      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) return show(ERR);
      var data = new URLSearchParams(new FormData(form));
      data.set("user_agent", navigator.userAgent);
      btn.disabled = true;
      /* Apps Script does not send CORS headers, so the reply cannot be read.
         no-cors still delivers the request. */
      fetch(endpoint, { method: "POST", mode: "no-cors", body: data })
        .then(function () { location.href = "/thank-you/"; })
        .catch(function () { btn.disabled = false; show(ERR); });
    });
  });
})();
