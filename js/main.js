// ═══════════ SD4A — interacciones ═══════════
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Slider del hero con dots ─────────────────────────────────────
const slides = document.querySelectorAll(".hero-slides .slide");
const dotsBox = document.getElementById("heroDots");
let current = 0;
let sliderTimer = null;

function goTo(i) {
  slides[current].classList.remove("active");
  dotsBox.children[current]?.classList.remove("active");
  current = i;
  slides[current].classList.add("active");
  dotsBox.children[current]?.classList.add("active");
}
function nextSlide() { goTo((current + 1) % slides.length); }
function restartTimer() {
  clearInterval(sliderTimer);
  sliderTimer = setInterval(nextSlide, 6000);
}

if (slides.length > 1 && dotsBox) {
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => { goTo(i); restartTimer(); });
    dotsBox.appendChild(b);
  });
  restartTimer();
}

// ── Sombra del topbar + regla de avance de lectura ───────────────
const topbar = document.getElementById("topbar");
const scrollRuler = document.getElementById("scrollRuler");
window.addEventListener("scroll", () => {
  topbar.classList.toggle("scrolled", window.scrollY > 10);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  scrollRuler.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}, { passive: true });

// ── Menú móvil ───────────────────────────────────────────────────
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

// ── Scrollspy: resaltar sección activa en el menú ────────────────
const navLinks = [...nav.querySelectorAll("a[href^='#']")];
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`)
      );
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach((s) => spy.observe(s));
}

// ── Aparición al hacer scroll (con cascada dentro de cada grilla) ─
const STAGGER_GROUPS = [".cards-3", ".sector-grid", ".project-grid", ".steps"];
STAGGER_GROUPS.forEach((sel) => {
  document.querySelectorAll(sel).forEach((group) => {
    [...group.children].forEach((child, i) => {
      if (child.classList.contains("reveal")) child.style.setProperty("--stagger", i);
    });
  });
});

const reveals = document.querySelectorAll(".reveal");
if (reduced || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el) => io.observe(el));
}

// ── Parallax sutil del hero ───────────────────────────────────────
const heroEl = document.getElementById("inicio");
if (heroEl && !reduced) {
  const slidesLayer = heroEl.querySelector(".hero-slides");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = heroEl.getBoundingClientRect();
      if (rect.bottom > 0) {
        slidesLayer.style.transform = `translateY(${window.scrollY * 0.18}px)`;
      }
      ticking = false;
    });
  }, { passive: true });
}

// ── Contador animado con cifras reales del contenido ──────────────
const statNums = document.querySelectorAll(".stat-num[data-count-source]");
if (statNums.length) {
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function animateCount(el, target) {
    if (reduced) { el.textContent = target; return; }
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * easeOut(p));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const statsIo = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const count = document.querySelectorAll(el.dataset.countSource).length;
      animateCount(el, count);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  statNums.forEach((el) => statsIo.observe(el));
}

// ── Lightbox de proyectos ────────────────────────────────────────
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbCaption = document.getElementById("lbCaption");
const projects = [...document.querySelectorAll("#projectGrid .project")];
let lbIndex = 0;

function openLightbox(i) {
  lbIndex = i;
  const img = projects[i].querySelector("img");
  const cap = projects[i].querySelector("figcaption strong");
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCaption.textContent = cap ? cap.textContent : img.alt;
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add("open"));
  document.body.classList.add("lb-locked");
}
function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.classList.remove("lb-locked");
  setTimeout(() => { lightbox.hidden = true; }, 250);
}
function stepLightbox(delta) {
  openLightbox((lbIndex + delta + projects.length) % projects.length);
}

projects.forEach((p, i) => {
  p.addEventListener("click", () => openLightbox(i));
  p.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); }
  });
});
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => stepLightbox(-1));
document.getElementById("lbNext").addEventListener("click", () => stepLightbox(1));
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});
