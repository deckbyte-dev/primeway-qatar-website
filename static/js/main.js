/* Primeway site script. No dependencies. The site works without it. */
(function () {
  var doc = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverOkM = window.matchMedia("(hover: hover) and (min-width: 961px)").matches;
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

  /* Services menu: click toggles, hover opens on desktop, Escape closes */
  var hm = doc.querySelector(".has-menu");
  if (hm) {
    var mb = hm.querySelector(".menu-btn");
    var setOpen = function (o) { hm.classList.toggle("open", o); mb.setAttribute("aria-expanded", o ? "true" : "false"); };
    mb.addEventListener("click", function () { setOpen(!hm.classList.contains("open")); });
    if (hoverOkM) {
      var t;
      hm.addEventListener("pointerenter", function () { clearTimeout(t); setOpen(true); });
      hm.addEventListener("pointerleave", function () { t = setTimeout(function () { setOpen(false); }, 160); });
    }
    doc.addEventListener("click", function (e) { if (!hm.contains(e.target)) setOpen(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") { setOpen(false); } });
    hm.addEventListener("click", function (e) { if (e.target.closest(".mega a")) { setOpen(false); if (typeof closeMenu === "function") closeMenu(); } });
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

  /* Section headlines: same word mask, triggered when they scroll into view */
  if (!reduce) {
    $$(".split").forEach(function (el) {
      var txt = el.textContent.trim();
      el.setAttribute("aria-label", txt);
      el.innerHTML = txt.split(/\s+/).map(function (w, i) {
        return '<span class="wm" aria-hidden="true"><span class="w" style="--i:' + i + '">' + w + "</span></span>";
      }).join(" ");
    });
  }

  /* Reveal on enter: text blocks, headlines and image wipes */
  var targets = $$(".rv, .split, .lines, .band-rule, .ft-rule, .form, .steps, .img-wrap");
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

  /* Statement: words light up as you read, the three mistakes get underlined */
  var fill = doc.querySelector(".fill");
  var words = [];
  var marks = [];
  if (fill && !reduce) {
    fill.setAttribute("aria-label", fill.textContent.trim());
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var sp = doc.createElement("span");
            sp.className = "fw";
            sp.setAttribute("aria-hidden", "true");
            sp.textContent = p;
            frag.appendChild(sp);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          wrap(n);
        }
      });
    })(fill);
    words = $$(".fill .fw");
    marks = $$(".fill mark").map(function (m) {
      var inner = m.querySelectorAll(".fw");
      return { el: m, last: words.indexOf(inner[inner.length - 1]) };
    });
  }

  /* Live Doha time next to the intro label */
  var clock = doc.querySelector("[data-clock]");
  if (clock && window.Intl && Intl.DateTimeFormat) {
    var tick = function () {
      try {
        clock.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Qatar" }).format(new Date());
      } catch (e) { clock.textContent = ""; }
    };
    tick();
    setInterval(tick, 20000);
  }

  /* Route progress */
  var steps = doc.querySelector(".steps");
  var stepItems = steps ? $$(".steps li") : [];

  /* Service cards: each card shrinks and dims as the next one slides over it */
  var cards = $$(".stack .card");

  /* CTA panel: teal light follows the pointer, the round button pulls toward it */
  var panel = doc.querySelector(".band");
  if (panel && hoverOkM && !reduce) {
    var pr = 0;
    panel.addEventListener("pointermove", function (e) {
      if (pr) return;
      pr = requestAnimationFrame(function () {
        pr = 0;
        var r = panel.getBoundingClientRect();
        panel.style.setProperty("--mx", (e.clientX - r.left) + "px");
        panel.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
    $$("[data-magnet]").forEach(function (el) {
      var core = el;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        core.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
        core.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", function () {
        core.style.setProperty("--tx", "0px");
        core.style.setProperty("--ty", "0px");
      });
    });
  }

  /* Enquiry box: a thin line along the top fills as the required fields are done */
  var enq = doc.querySelector(".final-form form");
  if (enq) {
    var box = enq.parentElement;
    var fillBar = function () {
      var n = enq.elements.name.value.trim() ? 1 : 0;
      var ph = enq.elements.phone.value.replace(/\D/g, "").length >= 7 ? 1 : 0;
      var ok = enq.elements.consent.checked ? 1 : 0;
      box.style.setProperty("--p", ((n + ph + ok) / 3).toFixed(3));
    };
    enq.addEventListener("input", fillBar);
    enq.addEventListener("change", fillBar);
    fillBar();
  }

  /* Footer: smooth back to top */
  $$("[data-top]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* FAQ: the big counter follows the open question */
  var faqItems = $$(".faq-item");
  var faqNum = doc.querySelector(".faq-count b");
  if (faqNum) {
    faqItems.forEach(function (d, i) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        faqNum.textContent = ("0" + (i + 1)).slice(-2);
        if (!reduce && faqNum.animate) {
          faqNum.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 600, easing: "cubic-bezier(.2,.7,.2,1)" });
        }
      });
    });
  }

  /* Company types: the photo follows the open item, and previews on hover */
  var tGrid = doc.querySelector(".types-grid");
  var tItems = $$(".types-list details");
  if (tGrid && tItems.length) {
    var tN = tGrid.querySelector(".tc-n"), tName = tGrid.querySelector(".tc-name"), tOf = tGrid.querySelector(".tc-of");
    var tOpen = function () { for (var k = 0; k < tItems.length; k++) if (tItems[k].open) return k; return 0; };
    var showType = function (i) {
      tGrid.setAttribute("data-img", i);
      var nn = ("0" + (i + 1)).slice(-2);
      if (tN) tN.textContent = nn;
      if (tOf) tOf.textContent = nn + " / " + ("0" + tItems.length).slice(-2);
      if (tName) tName.textContent = tItems[i].querySelector(".t-name").textContent;
    };
    tItems.forEach(function (d, i) {
      d.addEventListener("toggle", function () { if (d.open) showType(i); });
      d.querySelector("summary").addEventListener("mouseenter", function () { showType(i); });
    });
    var tList = doc.querySelector(".types-list");
    tList.addEventListener("mouseleave", function () { showType(tOpen()); });
    showType(tOpen());
  }

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
        marks.forEach(function (m) { m.el.classList.toggle("on", n > m.last); });
      }
      if (cards.length && window.innerWidth > 960) {
        cards.forEach(function (c, i) {
          var inner = c.firstElementChild;
          var next = cards[i + 1];
          var k = 0;
          if (next) {
            var gap = next.getBoundingClientRect().top - c.getBoundingClientRect().top;
            k = clamp(1 - gap / c.offsetHeight, 0, 1);
          }
          inner.style.setProperty("--sc", (1 - k * 0.05).toFixed(4));
          inner.style.setProperty("--dim", (k * 0.16).toFixed(3));
        });
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
