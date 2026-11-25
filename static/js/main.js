/* Primeway site script. No dependencies. The site works without it. */
(function () {
  var doc = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverOk = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Header: glass after scroll, hides on the way down ---------- */
  var header = doc.querySelector(".site-header");
  var lastY = window.scrollY;
  function headerState() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    var menuOpen = header.classList.contains("nav-open");
    if (!menuOpen && y > 240 && y > lastY + 6) header.classList.add("is-hidden");
    else if (y < lastY - 6 || y <= 240) header.classList.remove("is-hidden");
    lastY = y;
  }

  /* ---------- Mobile menu ---------- */
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

  /* ---------- Hero headline: words rise out of a mask ---------- */
  var h1 = doc.querySelector(".hero h1");
  if (h1 && !reduce) {
    var text = h1.textContent.trim();
    h1.setAttribute("aria-label", text);
    h1.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="wm" aria-hidden="true"><span class="w" style="--i:' + i + '">' + w + "</span></span>";
    }).join(" ");
  }

  /* ---------- Light that follows the pointer (hero) ---------- */
  var hero = doc.querySelector(".hero");
  if (hero && hoverOk && !reduce) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  }

  /* ---------- Glow that follows the pointer (service sheets) ---------- */
  doc.querySelectorAll("[data-glow]").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (hoverOk && !reduce) {
    doc.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var y = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Statement: words light up as you scroll ---------- */
  var fill = doc.querySelector(".fill");
  var fillWords = [];
  if (fill && !reduce) {
    var t = fill.textContent.trim();
    fill.setAttribute("aria-label", t);
    fill.innerHTML = t.split(/\s+/).map(function (w) {
      return '<span class="fw" aria-hidden="true">' + w + "</span>";
    }).join(" ");
    fillWords = Array.prototype.slice.call(fill.querySelectorAll(".fw"));
  }

  /* ---------- Steps: the route fills as you scroll ---------- */
  var steps = doc.querySelector(".steps");
  var stepItems = steps ? Array.prototype.slice.call(steps.querySelectorAll("li")) : [];

  /* ---------- 100%: counts up once ---------- */
  var count = doc.querySelector(".count");
  var counted = false;
  function runCount() {
    if (counted || !count) return;
    counted = true;
    var to = parseInt(count.getAttribute("data-to"), 10) || 100;
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = clamp((ts - start) / 1800, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      count.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (count && !reduce) {
    count.textContent = "0";
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { runCount(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(count);
    } else { runCount(); }
  }

  /* ---------- One scroll handler for all scroll-linked bits ---------- */
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    headerState();

    if (fillWords.length) {
      var r = fill.getBoundingClientRect();
      var prog = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      var n = fillWords.length;
      for (var i = 0; i < n; i++) {
        var o = 0.2 + 0.8 * clamp(prog * (n + 3) - i, 0, 1);
        fillWords[i].style.opacity = o.toFixed(2);
      }
    }
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var line = vh * 0.55;
      steps.style.setProperty("--p", clamp((line - sr.top) / sr.height, 0, 1).toFixed(3));
      stepItems.forEach(function (li) {
        var lr = li.getBoundingClientRect();
        li.classList.toggle("on", lr.top < line);
      });
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", update);
  update();
  if (reduce) {
    if (steps) { steps.style.setProperty("--p", 1); stepItems.forEach(function (li) { li.classList.add("on"); }); }
  }

  /* ---------- Company types: folding panels ---------- */
  var fold = doc.querySelector("[data-fold]");
  if (fold) {
    var items = Array.prototype.slice.call(fold.querySelectorAll(".fold-item"));
    var open = function (item) {
      items.forEach(function (it) {
        var on = it === item;
        it.classList.toggle("is-open", on);
        it.querySelector(".fold-btn").setAttribute("aria-expanded", on ? "true" : "false");
      });
    };
    items.forEach(function (item) {
      var btn = item.querySelector(".fold-btn");
      btn.addEventListener("click", function () { open(item); });
      if (hoverOk) item.addEventListener("pointerenter", function () {
        if (window.innerWidth > 960) open(item);
      });
    });
  }
})();
