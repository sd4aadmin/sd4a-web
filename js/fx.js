/* Capa de movimiento: GSAP + ScrollTrigger + Lenis. Si no cargan, el sitio funciona igual (main.js). */
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var EXPO = "expo.out", QUART = "power4.out";
  var mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", function () {
    document.documentElement.classList.add("fx");

    /* ── Desplazamiento suave ── */
    var lenis = null;
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          var target = id.length > 1 && document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -68, duration: 1.4, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
        });
      });
      var back = document.getElementById("backToTop");
      if (back) back.addEventListener("click", function (e) { e.stopImmediatePropagation(); lenis.scrollTo(0, { duration: 1.6 }); }, true);
    }

    /* ── Barra de progreso de lectura ── */
    var oldRuler = document.getElementById("scrollRuler");
    if (oldRuler) oldRuler.remove(); // evita dos barras de progreso a la vez
    var bar = document.createElement("div");
    bar.id = "scrollbar";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    /* ── Partir títulos en palabras con máscara ── */
    function splitWords(el) {
      var words = [];
      function wrap(node) {
        var w = document.createElement("span"); w.className = "w";
        var i = document.createElement("span"); i.className = "wi";
        node.parentNode.insertBefore(w, node);
        i.appendChild(node); w.appendChild(i);
        words.push(i);
      }
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var i = document.createElement("span"); i.className = "wi"; i.textContent = p;
            w.appendChild(i); frag.appendChild(w); words.push(i);
          });
          el.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          wrap(n);
        }
      });
      return words;
    }

    // Los elementos animados con GSAP dejan de depender de la clase .reveal
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.remove("reveal"); el.classList.add("in"); });

    /* ── Entrada del hero (coreografía) ── */
    var h1 = document.querySelector(".hero h1");
    if (h1) {
      var words = splitWords(h1);
      var tl = gsap.timeline({ defaults: { ease: EXPO } });
      tl.from(".hero .eyebrow", { autoAlpha: 0, y: 16, duration: 0.8 }, 0.1)
        .from(words, { yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.09 }, 0.15)
        .from(".hero-sub", { autoAlpha: 0, y: 24, duration: 0.9 }, 0.7)
        .from(".hero-actions .btn", { autoAlpha: 0, y: 22, duration: 0.8, stagger: 0.1 }, 0.9)
        .from(".hero-dots, .hero-strip", { autoAlpha: 0, duration: 1 }, 1.1);
      gsap.to(".hero-inner", {
        yPercent: 14, autoAlpha: 0, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 20%", scrub: true }
      });
    }

    /* ── Títulos de sección: palabra por palabra ── */
    document.querySelectorAll(".sheet-head").forEach(function (head) {
      var h2 = head.querySelector("h2");
      var rest = head.querySelectorAll(".eyebrow, p");
      var tlh = gsap.timeline({ scrollTrigger: { trigger: head, start: "top 82%", once: true }, defaults: { ease: EXPO } });
      if (rest.length) tlh.from(rest, { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.08 }, 0);
      if (h2) tlh.from(splitWords(h2), { yPercent: 110, duration: 1.1, stagger: 0.07 }, 0.05);
    });

    /* ── Entrada escalonada de tarjetas, sectores, pasos, cifras ── */
    ["#nosotros .container > *:not(.sheet-head)", ".plan-card", ".sector", ".step", ".stat", ".cta-inner", ".contact-solo > *"].forEach(function (sel) {
      var els = gsap.utils.toArray(sel);
      if (!els.length) return;
      gsap.set(els, { autoAlpha: 0, y: 56 });
      ScrollTrigger.batch(els, {
        start: "top 88%", once: true, interval: 0.08, batchMax: 6,
        onEnter: function (batch) { gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, ease: QUART, stagger: 0.1, overwrite: true }); }
      });
    });

    /* ── Proyectos: aparición + parallax interno de la foto ── */
    var projects = gsap.utils.toArray(".project");
    gsap.set(projects, { autoAlpha: 0, y: 48, scale: 0.96 });
    ScrollTrigger.batch(projects, {
      start: "top 92%", once: true, interval: 0.08, batchMax: 6,
      onEnter: function (batch) { gsap.to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: QUART, stagger: 0.07, overwrite: true }); }
    });
    projects.forEach(function (p) {
      var img = p.querySelector(".project-media img");
      if (!img) return;
      gsap.fromTo(img, { yPercent: -7, scale: 1.14 }, {
        yPercent: 7, ease: "none",
        scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
    var fb = document.getElementById("filterBar");
    if (fb) fb.addEventListener("click", function () {
      setTimeout(function () {
        projects.forEach(function (p) { gsap.set(p, { autoAlpha: 1, y: 0, scale: 1 }); });
        ScrollTrigger.refresh();
      }, 60);
    });

    /* ── Inclinación 3D y brillo que sigue al cursor (solo con mouse) ── */
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      gsap.utils.toArray(".plan-card, .sector, .step").forEach(function (card) {
        var rect = null;
        var rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
        var ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
        gsap.set(card, { transformPerspective: 900 });
        card.addEventListener("pointerenter", function () { rect = card.getBoundingClientRect(); });
        card.addEventListener("pointermove", function (e) {
          var r = rect || (rect = card.getBoundingClientRect());
          var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          ry((px - 0.5) * 9); rx((0.5 - py) * 9);
          card.style.setProperty("--mx", px * 100 + "%");
          card.style.setProperty("--my", py * 100 + "%");
        });
        card.addEventListener("pointerleave", function () { rx(0); ry(0); });
      });

      /* Botones magnéticos */
      gsap.utils.toArray(".btn-solid, .btn-ghost, .btn-mint").forEach(function (btn) {
        var qx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
        var qy = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          qx((e.clientX - (r.left + r.width / 2)) * 0.28);
          qy((e.clientY - (r.top + r.height / 2)) * 0.28);
        });
        btn.addEventListener("pointerleave", function () { qx(0); qy(0); });
      });
    }

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    return function () { if (lenis) lenis.destroy(); bar.remove(); };
  });
})();
