(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ── Cookies ── */
  var cookie = $("#cookieBanner");
  if (cookie && !store("sd4a_cookies_accepted")) cookie.hidden = false;
  var accept = $("#cookieAccept");
  if (accept) accept.addEventListener("click", function () { store("sd4a_cookies_accepted", "1"); cookie.hidden = true; });

  /* ── Menú móvil ── */
  var toggle = $("#navToggle"), nav = $("#nav");
  function closeNav() { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menú"); }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ── Filtros de obras ── */
  var runs = $$(".run"), count = $("#workCount");
  function applyFilter(f) {
    var shown = 0, frames = 0;
    runs.forEach(function (r) {
      var on = f === "all" || r.getAttribute("data-cat") === f;
      r.hidden = !on;
      if (on) { shown++; frames += $$(".frame", r).length; r.classList.add("in"); }
    });
    if (count) count.textContent = shown + (shown === 1 ? " obra" : " obras") + " · " + frames + " imágenes";
  }
  $$("#filterBar button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#filterBar button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      applyFilter(b.getAttribute("data-filter"));
    });
  });
  applyFilter("all");

  /* ── Visor ── */
  var lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCaption"), opener = null, list = [], idx = 0;
  function show(i) {
    idx = (i + list.length) % list.length;
    var b = list[idx], im = $("img", b);
    lbImg.src = b.getAttribute("data-full");
    lbImg.alt = im ? im.alt : "";
    lbCap.textContent = (im ? im.alt : "") + " (" + (idx + 1) + " de " + list.length + ")";
  }
  function openLb(b) {
    opener = b;
    list = $$(".run:not([hidden]) .frame");
    show(list.indexOf(b));
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = "";
    lbImg.removeAttribute("src");
    if (opener) opener.focus();
  }
  $$(".frame").forEach(function (b) { b.addEventListener("click", function () { openLb(b); }); });
  if (lb) {
    $("#lbClose").addEventListener("click", closeLb);
    $("#lbPrev").addEventListener("click", function () { show(idx - 1); });
    $("#lbNext").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "Tab") {
        var f = $$("button", lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── Servicios: índice con vista previa ── */
  var pImg = $("#previewImg"), pTxt = $("#previewText"), pTimer;
  function preview(li) {
    var group = li.closest(".group");
    var src = li.getAttribute("data-image") || (group && group.getAttribute("data-image"));
    var alt = li.getAttribute("data-alt") || (group && group.getAttribute("data-alt")) || "";
    $$(".group li.on").forEach(function (x) { x.classList.remove("on"); });
    li.classList.add("on");
    pTxt.textContent = li.getAttribute("data-desc") || "";
    if (src && pImg.getAttribute("src") !== src) {
      pImg.classList.add("swap");
      clearTimeout(pTimer);
      pTimer = setTimeout(function () { pImg.src = src; pImg.alt = alt; pImg.classList.remove("swap"); }, reduce ? 0 : 120);
    }
  }
  $$(".group li").forEach(function (li) {
    li.addEventListener("mouseenter", function () { preview(li); });
    li.addEventListener("focus", function () { preview(li); });
  });

  /* ── Proceso: carrusel arrastrable ── */
  var track = $("#moments"), bar = $("#progressBar");
  if (track) {
    var moments = $$(".moment", track);
    function step(dir) {
      var w = moments[0].getBoundingClientRect().width + 16;
      track.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
    }
    function progress() {
      var max = track.scrollWidth - track.clientWidth;
      var vis = track.clientWidth / track.scrollWidth;
      var pos = max > 0 ? track.scrollLeft / max : 0;
      bar.style.width = Math.max(vis * 100, 12) + "%";
      bar.style.transform = "translateX(" + pos * (100 / Math.max(vis, 0.12) - 100) + "%)";
    }
    $("#prevMoment").addEventListener("click", function () { step(-1); });
    $("#nextMoment").addEventListener("click", function () { step(1); });
    track.addEventListener("scroll", progress, { passive: true });
    window.addEventListener("resize", progress);
    progress();

    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add("drag"); }
      track.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () { down = false; track.classList.remove("drag"); });
    track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
  }

  /* ── WhatsApp ── */
  var form = $("#waForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("#waName").value.trim(), m = $("#waMsg").value.trim();
    var t = "Hola SD4A" + (n ? ", soy " + n : "") + (m ? ". Mi proyecto: " + m : ". Quiero cotizar un proyecto") + ".";
    window.open(form.getAttribute("action") + "?text=" + encodeURIComponent(t), "_blank", "noopener");
  });

  /* ── Hora local de Colombia ── */
  var clock = $("#clock");
  function tick() {
    try {
      var d = new Date();
      clock.textContent = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "America/Bogota" }).format(d);
      clock.setAttribute("datetime", d.toISOString());
    } catch (err) { clock.textContent = ""; }
  }
  if (clock) { tick(); setInterval(tick, 30000); }

  /* ── Aparecer al desplazarse ── */
  $$(".band .col, .group, .tile, .moment, .trio > div, .facts p, .statement").forEach(function (el, i) {
    el.classList.add("reveal");
    el.style.setProperty("--i", String(i % 6));
  });
  var rev = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (r) { io.observe(r); });
  } else rev.forEach(function (r) { r.classList.add("in"); });

  /* ── Cabecera con sombra al desplazarse ── */
  var hdr = $(".bar");
  if (hdr) window.addEventListener("scroll", function () { hdr.classList.toggle("scrolled", window.scrollY > 8); }, { passive: true });

  /* ── Volver arriba ── */
  var top = $("#backToTop");
  if (top) {
    window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 900); }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  }
})();
