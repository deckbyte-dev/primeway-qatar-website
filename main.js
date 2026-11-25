/* Primeway site script. No dependencies. The site works without it. */
(function () {
  var doc = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var $$ = function (s) { return Array.prototype.slice.call(doc.querySelectorAll(s)); };

  /* Header: glass after scroll, hides while scrolling down */
  var header = doc.querySelector(".site-header");
  var lastY = window.scrollY;
  function headerState() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    if (!header.classList.contains("nav-open")) {
      if (y > 240 && y > lastY + 6) header.classList.add("is-hidden");
      else if (y < lastY - 6 || y <= 240) header.classList.remove("is-hidden");
    }
    lastY = y;
  }

  /* Mobile menu */
  var toggle = doc.querySelector(".nav-toggle");
  var nav = doc.getElementById("site-nav");
  function closeMenu() {
    header.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    doc.body.style.overflow = "";
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      doc.body.style.overflow = open ? "hidden" : "";
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) { closeMenu(); toggle.focus(); }
    });
  }

  /* Hero headline: words rise out of a mask */
  var h1 = doc.querySelector(".hero h1");
  if (h1 && !reduce) {
    var text = h1.textContent.trim();
    h1.setAttribute("aria-label", text);
    h1.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="wm" aria-hidden="true"><span class="w" style="--i:' + i + '">' + w + "</span></span>";
    }).join(" ");
  }

  /* Reveal on enter: text blocks and image wipes */
  var targets = $$(".rv, .img-wrap");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }

  /* Statement: words light up as you read */
  var fill = doc.querySelector(".fill");
  var words = [];
  if (fill && !reduce) {
    var t = fill.textContent.trim();
    fill.setAttribute("aria-label", t);
    fill.innerHTML = t.split(/\s+/).map(function (w) { return '<span class="fw" aria-hidden="true">' + w + "</span>"; }).join(" ");
    words = $$(".fill .fw");
  }

  /* Route progress */
  var steps = doc.querySelector(".steps");
  var stepItems = steps ? $$(".steps li") : [];

  /* Count up */
  var count = doc.querySelector(".count");
  if (count && "IntersectionObserver" in window && !reduce) {
    var to = +count.getAttribute("data-to") || 100;
    count.textContent = "0";
    var cio = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      cio.disconnect();
      var t0 = performance.now();
      (function tick(n) {
        var p = clamp((n - t0) / 1600, 0, 1);
        count.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.5 });
    cio.observe(count);
  }

  /* Scroll-linked: parallax, words, route */
  var par = $$("[data-parallax] img, [data-parallax-img]");
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    headerState();
    if (!reduce) {
      par.forEach(function (img) {
        var box = img.parentElement.getBoundingClientRect();
        if (box.bottom < -100 || box.top > vh + 100) return;
        var p = (box.top + box.height / 2 - vh / 2) / vh; /* -1..1 */
        var max = img.offsetHeight - box.height;
        img.style.setProperty("--py", (-max / 2 + clamp(p, -1, 1) * -max / 2).toFixed(1) + "px");
      });
      if (words.length) {
        var r = fill.getBoundingClientRect();
        var prog = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
        var n = Math.round(prog * words.length);
        words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      }
      if (steps) {
        var s = steps.getBoundingClientRect();
        var sp = clamp((vh * 0.8 - s.top) / (s.height + vh * 0.2), 0, 1);
        steps.style.setProperty("--p", sp.toFixed(3));
        stepItems.forEach(function (li, i) { li.classList.toggle("on", sp > i / stepItems.length + 0.02); });
      }
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", req, { passive: true });
  window.addEventListener("resize", req);
  frame();
})();
