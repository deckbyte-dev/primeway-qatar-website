/* Inner pages: highlights the current section in the table of contents. */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (!links.length || !("IntersectionObserver" in window)) return;
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  var current = null;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (current) current.classList.remove("on");
      current = map[e.target.id];
      if (current) {
        current.classList.add("on");
        var box = current.closest(".toc");
        if (box && box.scrollHeight > box.clientHeight && window.innerWidth > 960) {
          box.scrollTop = current.offsetTop - box.clientHeight / 3;
        }
      }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  document.querySelectorAll(".ps[id]").forEach(function (s) { io.observe(s); });
})();
