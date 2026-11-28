/* Primeway site script. Lenis (smooth scroll) is optional; everything else is plain JS. */
(function () {
  window.__pw = true;
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var canIO = "IntersectionObserver" in window;

  var lenis = null;
  if (window.Lenis && !reduce && fine) {
    lenis = new window.Lenis({ lerp: 0.1, anchors: { offset: -90 } });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }

  /* ---- Split headlines into masked words ---- */
  $$(".split").forEach(function (el) {
    if (!reduce) {
      var accent = (el.getAttribute("data-accent") || "").toLowerCase().split(" ").filter(Boolean);
      var label = el.textContent.replace(/\s+/g, " ").trim();
      var i = 0;
      (function wrap(node, accented) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 1) return wrap(n, accented);
          if (n.nodeType !== 3) return;
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) return frag.appendChild(doc.createTextNode(" "));
            var m = doc.createElement("span"), w = doc.createElement("span");
            m.className = "wm"; m.setAttribute("aria-hidden", "true");
            w.className = "w" + (accent.indexOf(p.toLowerCase()) > -1 ? " accent" : "");
            w.style.setProperty("--i", i++); w.textContent = p;
            m.appendChild(w); frag.appendChild(m);
          });
          node.replaceChild(frag, n);
        });
      })(el);
      el.setAttribute("aria-label", label);
    }
    el.classList.add("ready");
  });

  /* ---- Preloader, then start the page ---- */
  var pre = $(".preloader");
  function start() {
    doc.body.classList.add("ready-page");
    var targets = $$(".rv, .split");
    if (!canIO || reduce) return targets.forEach(function (t) { t.classList.add("in"); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    targets.forEach(function (t) { io.observe(t); });
  }
  if (pre && root.classList.contains("first") && !reduce) {
    var num = $("[data-pl]"), t0 = null;
    var step = function (now) {
      if (t0 === null) t0 = now;
      var p = clamp((now - t0) / 1100, 0, 1);
      num.textContent = Math.round(100 * (1 - Math.pow(1 - p, 3)));
      if (p < 1) return requestAnimationFrame(step);
      pre.classList.add("done");
      setTimeout(start, 350);
      setTimeout(function () { root.classList.remove("first"); }, 1200);
    };
    requestAnimationFrame(step);
    /* never leave the curtain up (background tabs pause animation frames) */
    setTimeout(function () { if (!pre.classList.contains("done")) { pre.classList.add("done"); root.classList.remove("first"); start(); } }, 2600);
    try { sessionStorage.setItem("pw-seen", "1"); } catch (e) {}
  } else {
    root.classList.remove("first");
    requestAnimationFrame(start);
    setTimeout(start, 400);
  }

  /* ---- Header and menus ---- */
  var header = $(".site-header"), toggle = $(".nav-toggle"), hm = $(".has-menu");
  var lastY = scrollY;
  function setMenu(open) {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    doc.body.style.overflow = open ? "hidden" : "";
    if (lenis) lenis[open ? "stop" : "start"]();
  }
  toggle.addEventListener("click", function () { setMenu(!header.classList.contains("nav-open")); });
  if (hm) {
    var mb = $(".menu-btn", hm), timer;
    var setSub = function (o) { hm.classList.toggle("open", o); mb.setAttribute("aria-expanded", o ? "true" : "false"); };
    mb.addEventListener("click", function (e) {
      /* with a mouse, hover already opened it: a click should not shut it again */
      setSub(fine && innerWidth > 1020 && e.detail > 0 ? true : !hm.classList.contains("open"));
    });
    hm.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && innerWidth > 1020) { clearTimeout(timer); setSub(true); } });
    hm.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && innerWidth > 1020) timer = setTimeout(function () { setSub(false); }, 180); });
    doc.addEventListener("click", function (e) { if (!hm.contains(e.target)) setSub(false); });
  }
  header.addEventListener("click", function (e) {
    if (!e.target.closest("nav a")) return;
    if (hm) hm.classList.remove("open");
    setMenu(false);
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (hm) { hm.classList.remove("open"); $(".menu-btn", hm).setAttribute("aria-expanded", "false"); }
    if (header.classList.contains("nav-open")) { setMenu(false); toggle.focus(); }
  });

  /* ---- Doha clock ---- */
  var clocks = $$("[data-clock]");
  var tick = function () {
    try {
      var t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Qatar" }).format(new Date());
      clocks.forEach(function (c) { c.textContent = t; });
    } catch (e) {}
  };
  tick(); setInterval(tick, 20000);

  /* ---- Words light up as you read ---- */
  var fill = $(".fill"), words = [];
  if (fill && !reduce) {
    var txt = fill.textContent.trim();
    fill.innerHTML = '<span class="sr-only"></span><span aria-hidden="true">' + txt.split(/\s+/).map(function (w) { return '<span class="fw">' + w + "</span>"; }).join(" ") + "</span>";
    fill.firstChild.textContent = txt;
    words = $$(".fw", fill);
  }

  /* ---- Count up ---- */
  if (canIO && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), from = to ? 0 : 60, s = null;
        requestAnimationFrame(function run(now) {
          if (s === null) s = now;
          var p = clamp((now - s) / 1700, 0, 1);
          el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(run);
        });
      });
    }, { threshold: 0.6 });
    $$("[data-count]").forEach(function (c) { cio.observe(c); });
  }

  /* ---- Scroll-linked effects ---- */
  var bar = $(".progress i"), par = $$("[data-parallax], .hero-bg"), big = $(".big100");
  var route = $(".route"), track = route && $(".route-track", route), view = route && $(".route-view", route);
  var travel = 0;
  function layoutRoute() {
    if (!route) return;
    var on = innerWidth > 1020 && innerHeight > 620 && !reduce;
    route.classList.toggle("is-h", on);
    route.style.height = ""; track.style.removeProperty("--x");
    if (!on) return;
    travel = Math.max(0, track.scrollWidth - view.clientWidth);
    route.style.height = (innerHeight + travel) + "px";
  }
  var waiting = false;
  function frame() {
    waiting = false;
    var y = scrollY, vh = innerHeight, max = root.scrollHeight - vh;
    bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    header.classList.toggle("is-scrolled", y > 30);
    if (!header.classList.contains("nav-open") && !(hm && hm.classList.contains("open"))) {
      if (y > 400 && y > lastY + 4) header.classList.add("is-hidden");
      else if (y < lastY - 4 || y <= 400) header.classList.remove("is-hidden");
    }
    lastY = y;
    if (reduce) return;
    par.forEach(function (box) {
      var r = box.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var img = box.firstElementChild, spare = img.offsetHeight - box.offsetHeight;
      var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      /* top-of-page heroes start flush; other photos travel across their spare height */
      var py = box.parentElement.offsetTop === 0 ? -spare * clamp(y / r.height, 0, 1) : -spare * (1 - p);
      img.style.setProperty("--py", py.toFixed(1) + "px");
    });
    if (words.length) {
      var f = fill.getBoundingClientRect();
      var n = Math.round(clamp((vh * 0.85 - f.top) / (f.height + vh * 0.25), 0, 1) * words.length);
      words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    }
    if (big) {
      var b = big.getBoundingClientRect(), bp = clamp((vh - b.top) / (vh * 0.8), 0, 1);
      big.style.setProperty("--s", (0.7 + 0.3 * bp).toFixed(3));
      big.style.setProperty("--bg", (30 + 50 * bp).toFixed(1) + "%");
    }
    if (route && route.classList.contains("is-h")) {
      var rr = route.getBoundingClientRect(), rp = travel ? clamp(-rr.top / travel, 0, 1) : 0;
      track.style.setProperty("--x", (-rp * travel).toFixed(1) + "px");
      route.style.setProperty("--p", rp.toFixed(4));
    }
  }
  function req() { if (!waiting) { waiting = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", function () { layoutRoute(); req(); });
  addEventListener("load", function () { layoutRoute(); req(); });
  if (doc.fonts) doc.fonts.ready.then(function () { layoutRoute(); req(); });
  layoutRoute(); frame();

  /* ---- Hero: drifting city lights ---- */
  var cv = $(".hero-lights");
  if (cv && !reduce && cv.getContext) {
    var cx = cv.getContext("2d"), W = 0, H = 0, dots = [], visible = true, mx = -999, my = -999;
    var colors = ["79,227,204", "246,189,90", "255,255,255"];
    var size = function () {
      var d = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
      dots = [];
      for (var i = 0, n = Math.min(90, W / 14); i < n; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.2 + .5, v: Math.random() * .35 + .08, c: colors[i % 3], t: Math.random() * 6 });
    };
    var draw = function (now) {
      requestAnimationFrame(draw);
      if (!visible) return;
      cx.clearRect(0, 0, W, H);
      dots.forEach(function (p) {
        p.y -= p.v; p.x += Math.sin(now / 2400 + p.t) * .18;
        var dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < 130 && d > 0) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
        var a = .35 + Math.sin(now / 700 + p.t) * .3;
        cx.fillStyle = "rgba(" + p.c + "," + a.toFixed(2) + ")";
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
      });
    };
    size(); addEventListener("resize", size); requestAnimationFrame(draw);
    cv.parentElement.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    if (canIO) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
  }

  /* ---- Mouse: cursor ring, magnetic buttons, tilting tiles ---- */
  if (fine && !reduce) {
    var cur = $(".cursor"), tx = 0, ty = 0, x = 0, y2 = 0;
    addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY; cur.classList.add("on");
      cur.classList.toggle("big", !!e.target.closest("a, button, summary, label, .panel"));
    });
    root.addEventListener("pointerleave", function () { cur.classList.remove("on"); });
    (function follow() { x += (tx - x) * .2; y2 += (ty - y2) * .2; cur.style.transform = "translate3d(" + x + "px," + y2 + "px,0)"; requestAnimationFrame(follow); })();
    $$("[data-magnet]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + "px");
        el.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", function () { el.style.removeProperty("--tx"); el.style.removeProperty("--ty"); });
    });
    $$("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (px * 100) + "%"); el.style.setProperty("--my", (py * 100) + "%");
        el.style.setProperty("--ry", ((px - .5) * 7).toFixed(2) + "deg"); el.style.setProperty("--rx", ((.5 - py) * 7).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () { el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); });
    });
  }

  /* ---- Company type panels ---- */
  var panels = $$(".panel");
  panels.forEach(function (p) {
    var open = function () { panels.forEach(function (o) { o.classList.toggle("on", o === p); }); };
    p.addEventListener("click", open);
    p.addEventListener("focusin", open);
    p.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") open(); });
    p.addEventListener("transitionend", function (e) { if (e.target === p) req(); });
  });

  /* ---- Setup planner ---- */
  var planner = $(".pl-form");
  if (planner) {
    /* Wording follows the page content in content/pages/. */
    var TYPES = {
      llc: { name: "LLC on the mainland", note: "The usual choice if you want to sell to customers anywhere in Qatar.", docs: ["A lease or address for the office", "Details of the business activity", "Three or four trade name options"] },
      fz: { name: "Free zone company", note: "Good for export and storage, with limits on selling inside Qatar. We confirm the current zone rules before you apply.", docs: ["Details of the business activity", "Three or four trade name options"] },
      qfc: { name: "QFC company", note: "For financial and professional services. The QFC has its own legal framework and tax regime.", docs: ["Details of the business activity", "Name options for the company"] },
      rep: { name: "Representative office", note: "To explore the market and promote the parent company. It cannot invoice or earn income in Qatar.", docs: ["Parent company documents, attested and translated into Arabic", "An address for the office"] },
      ecom: { name: "E-commerce licence", note: "Issued through Single Window with a commercial registration. Some products need extra approval.", docs: ["A list of what you will sell", "Three or four trade name options", "Your website, app or social page details"] }
    };
    var OWNERS = {
      res: ["Passport copies of all owners", "Qatar ID of owners living in Qatar"],
      abroad: ["Passport copies of all owners", "Power of attorney, if a step is done for you in Qatar"],
      corp: ["The owner company's incorporation papers, attested if issued abroad", "Arabic translation of foreign documents"]
    };
    var EXTRA = {
      visa: "Visas: staff passport copies, requested after the company is set up",
      attest: "Attestation: the original documents to be attested",
      trans: "Translation: clear scans of the documents to translate",
      tm: "Trademark: your logo or brand name and what you sell under it",
      bank: "Bank account: a resolution naming the signatories, once the CR and cards are issued"
    };
    var out = $(".pl-out"), list = $(".pl-list", out), plan = {};
    var render = function () {
      var type = planner.querySelector("[name=type]:checked").value;
      var owner = planner.querySelector("[name=owner]:checked").value;
      var extras = $$("[name=extra]:checked", planner);
      var t = TYPES[type];
      var docs = OWNERS[owner].concat(t.docs, extras.map(function (e) { return EXTRA[e.value]; }));
      docs = docs.filter(function (d, i) { return docs.indexOf(d) === i; });
      $(".pl-title", out).textContent = t.name;
      $(".pl-note", out).textContent = t.note;
      list.textContent = "";
      docs.forEach(function (d, i) { var li = doc.createElement("li"); li.textContent = d; li.style.animationDelay = (i * 40) + "ms"; list.appendChild(li); });
      var label = function (i) { return i.nextElementSibling.textContent; };
      plan.text = "I would like a written quote.\nCompany type: " + t.name +
        "\nOwners: " + label(planner.querySelector("[name=owner]:checked")) +
        (extras.length ? "\nAlso need: " + extras.map(label).join(", ") : "");
    };
    planner.addEventListener("change", render);
    render();
    $(".pl-send", out).addEventListener("click", function () {
      var form = $("#enquiry form");
      if (!form) return;
      form.elements.message.value = plan.text;
      form.elements.service.value = "Company formation";
      var target = $("#enquiry .final-card");
      if (lenis) lenis.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      form.elements.name.focus({ preventScroll: true });
    });
  }

  /* ---- Table of contents highlight (inner pages) ---- */
  var links = $$(".toc a");
  if (links.length && canIO) {
    var map = {}, current = null;
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (current) current.classList.remove("on");
        current = map[e.target.id];
        if (!current) return;
        current.classList.add("on");
        var box = current.closest(".toc");
        if (box.scrollHeight > box.clientHeight && innerWidth > 1020) box.scrollTop = current.offsetTop - box.clientHeight / 3;
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    $$(".ps[id]").forEach(function (s) { tio.observe(s); });
  }

  /* ---- Back to top ---- */
  $$("[data-top]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0); else scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
