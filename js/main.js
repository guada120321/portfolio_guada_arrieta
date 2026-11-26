/* ============================================================
   ARRIETA GUADALUPE — AG's DINER (Portafolio retro-pop)
   JavaScript vanilla, sin dependencias.
   Los textos, fotos y enlaces se editan en index.html.
   ============================================================ */

(() => {
  "use strict";

  const CONFIG = {
    birthDate: "2008-04-28",
    timeZone: "America/Argentina/Buenos_Aires",
    locale: "es-AR",
    email: "guadaarrieta120321@gmail.com",
  };

  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));
  const root = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ── Precarga ────────────────────────────────────────────── */
  const preloader = $("#preloader");
  function finishPreloader() {
    preloader?.classList.add("is-done");
    window.setTimeout(() => preloader?.remove(), 650);
  }
  if (prefersReduced) {
    finishPreloader();
  } else {
    window.addEventListener("load", () => window.setTimeout(finishPreloader, 600));
    window.setTimeout(finishPreloader, 2600);
  }

  /* ── Toast (lo usa el sonido, el form y los guiños) ─────── */
  const toast = $("#toast");
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  /* ── Modo claro / oscuro ─────────────────────────────────── */
  const THEME_KEY = "dulce-theme";
  const themeToggle = $("#themeToggle");
  function applyTheme(theme, persist = true) {
    root.dataset.theme = theme === "light" ? "light" : "dark";
    const isDark = root.dataset.theme === "dark";
    themeToggle?.setAttribute("aria-pressed", String(isDark));
    themeToggle?.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    themeToggle?.setAttribute("title", isDark ? "Estás en modo oscuro" : "Estás en modo claro");
    $('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#1A1A1A" : "#FFFDF9");
    if (persist) {
      try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch { /* sin persistencia */ }
    }
  }
  applyTheme(root.dataset.theme || "dark", false);
  themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
    setSkin(root.dataset.skin || "diner", true, false);
  });

  /* ── Acentos golosina ───────────────────────────────────── */
  const ACCENT_KEY = "dulce-accent";
  const ACCENTS = ["pink", "yellow", "cyan", "brown"];
  const accentButtons = $$("[data-set-accent]");
  function setAccent(name, persist = true) {
    const value = ACCENTS.includes(name) ? name : "pink";
    root.dataset.accent = value;
    accentButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.setAccent === value));
    });
    if (persist) {
      try { localStorage.setItem(ACCENT_KEY, value); } catch { /* sin persistencia */ }
    }
  }
  /* En Juegos los tres puntos recuperan los colores del mundo original. */
  const GAMES_ACCENT_LABELS = {
    pink: ["Acento Cumbia (dorado)", "Cumbia"],
    yellow: ["Acento Corazón (naranja)", "Corazón"],
    cyan: ["Acento Energía (verde)", "Energía"],
  };
  function updateAccentLabels(skin) {
    accentButtons.forEach((btn) => {
      if (!btn.hasAttribute("data-base-label")) {
        btn.dataset.baseLabel = btn.getAttribute("aria-label") || "";
        btn.dataset.baseTitle = btn.getAttribute("title") || "";
      }
      const game = skin === "games" ? GAMES_ACCENT_LABELS[btn.dataset.setAccent] : null;
      if (game) {
        btn.setAttribute("aria-label", game[0]);
        btn.setAttribute("title", game[1]);
      } else {
        btn.setAttribute("aria-label", btn.dataset.baseLabel);
        btn.setAttribute("title", btn.dataset.baseTitle);
      }
    });
  }
  accentButtons.forEach((btn) => btn.addEventListener("click", () => setAccent(btn.dataset.setAccent)));
  let savedAccent = "pink";
  try { savedAccent = localStorage.getItem(ACCENT_KEY) || "pink"; } catch { savedAccent = "pink"; }
  setAccent(root.dataset.accent || savedAccent, false);

  /* ── Selector de versiones (5 identidades, mismos datos) ─── */
  const SKIN_KEY = "dulce-skin";
  const SKINS = ["diner", "formal", "elegance", "games", "dev"];
  const SKIN_LABELS = {
    diner: "Comida · diner y Coca-Cola",
    formal: "Formal · perfil profesional",
    elegance: "Elegancia dorada",
    games: "Juegos · mundo original",
    dev: "Programación · terminal",
  };
  const SKIN_THEME_COLORS = {
    diner: null, // la decide el modo claro / oscuro
    formal: "#0F1721",
    elegance: "#120F0A",
    games: "#080d22",
    dev: "#050D09",
  };
  const skinPanel = $("#skinPanel");
  const skinButtons = $$("[data-set-skin]");
  const skinOpeners = $$("[data-open-skins]");

  function setSkin(name, persist = true, announce = true) {
    const value = SKINS.includes(name) ? name : "diner";
    root.dataset.skin = value;
    /* El cuarto punto golosina no existe en el mundo original. */
    if (value === "games" && root.dataset.accent === "brown") setAccent("pink", false);
    skinButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.setSkin === value));
    });
    const themeColor = SKIN_THEME_COLORS[value] ||
      (root.dataset.theme === "light" ? "#FFFDF9" : "#1A1A1A");
    $('meta[name="theme-color"]')?.setAttribute("content", themeColor);
    if (persist) {
      try { localStorage.setItem(SKIN_KEY, value); } catch { /* sin persistencia */ }
    }
    syncLayers(value);
    updateAccentLabels(value);
    updateSkinCopy(value);
    initCarousels();
    initTabs();
    initDynamicCards();
    if (value === "games") initMario();
    if (announce) showToast(`Versión: ${SKIN_LABELS[value]}`);
  }
  /* El mundo Mario original vive en su propia capa; el sitio compartido
     (cabecera, selector y panel) permanece disponible encima de él. */
  const dulceSite = $("#dulceSite");
  const marioLayer = $("#marioOriginal");
  let marioReady = false;
  const NAV_TO_MARIO = {
    "#inicio": "#marioInicio",
    "#sobre-mi": "#marioSobreMi",
    "#servicios": "#marioServicios",
    "#proyectos": "#marioProyectos",
    "#habilidades": "#marioHabilidades",
    "#contacto": "#marioContacto",
  };
  const NAV_TO_DULCE = Object.fromEntries(Object.entries(NAV_TO_MARIO).map(([a, b]) => [b, a]));

  function syncLayers(value) {
    const isGames = value === "games";
    if (dulceSite) dulceSite.hidden = isGames;
    if (marioLayer) marioLayer.hidden = !isGames;
    $$(".mobile-menu nav a, .site-footer__top nav a, .nav__link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!link.hasAttribute("data-original-href")) link.setAttribute("data-original-href", href);
      const next = isGames ? NAV_TO_MARIO[href] : NAV_TO_DULCE[href];
      if (next) link.setAttribute("href", next);
    });
  }

  function openSkinPanel() {
    if (!skinPanel) return;
    closeCommandPalette?.();
    setMenu?.(false);
    skinPanel.classList.add("is-open");
    skinPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("skin-panel-open");
    skinOpeners.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
    window.setTimeout(() => {
      skinPanel.querySelector(`[data-set-skin="${root.dataset.skin}"]`)?.focus();
    }, 0);
  }
  function closeSkinPanel() {
    skinPanel?.classList.remove("is-open");
    skinPanel?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("skin-panel-open");
    skinOpeners.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
  }
  skinButtons.forEach((btn) => btn.addEventListener("click", () => {
    setSkin(btn.dataset.setSkin);
    closeSkinPanel();
  }));
  skinOpeners.forEach((btn) => btn.addEventListener("click", () => {
    if (skinPanel?.classList.contains("is-open")) closeSkinPanel();
    else openSkinPanel();
  }));
  skinPanel?.querySelectorAll("[data-close-skins]").forEach((el) => {
    el.addEventListener("click", closeSkinPanel);
  });
  let savedSkin = "diner";
  try { savedSkin = localStorage.getItem(SKIN_KEY) || "diner"; } catch { savedSkin = "diner"; }
  setSkin(root.dataset.skin || savedSkin, false, false);

  /* ── Edad y reloj local ──────────────────────────────────── */
  function updateAge() {
    const birth = new Date(`${CONFIG.birthDate}T00:00:00`);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
    $$("[data-age]").forEach((el) => { el.textContent = String(age); });
  }
  updateAge();
  window.setInterval(updateAge, 60 * 60 * 1000);

  const clockEls = $$("[data-clock], #localClock");
  function updateClock() {
    if (!clockEls.length) return;
    try {
      const parts = new Intl.DateTimeFormat(CONFIG.locale, {
        timeZone: CONFIG.timeZone,
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }).formatToParts(new Date());
      const value = (type) => parts.find((part) => part.type === type)?.value ?? "--";
      clockEls.forEach((el) => { el.textContent = `${value("hour")}:${value("minute")}:${value("second")} GMT-3`; });
    } catch {
      clockEls.forEach((el) => { el.textContent = "--:--:-- GMT-3"; });
    }
  }
  updateClock();
  window.setInterval(updateClock, 1000);

  /* ── Aparición suave de secciones ────────────────────────── */
  const reveals = $$("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            entry.target.style.setProperty("--d", `${Math.min(i * 0.05, 0.25)}s`);
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
    window.setTimeout(() => reveals.forEach((el) => el.classList.add("is-visible")), 3500);
  }

  /* ── Burbujas efervescentes generadas por el objeto activo ─ */
  const hero = $(".hero");
  const heroBubbles = $("#heroBubbles");
  const bubbleSources = $$("[data-bubble-source]");
  let lastPointerBubble = 0;
  let lastScrollBubble = 0;

  // Solo el elemento de la versión visible puede generar burbujas.
  function activeBubbleSource() {
    return bubbleSources.find((el) => el.getClientRects().length > 0) || null;
  }
  function spawnBubble(clientX, clientY) {
    if (prefersReduced || !hero || !heroBubbles) return;
    const rect = hero.getBoundingClientRect();
    const size = 8 + Math.random() * 20;
    const bubble = document.createElement("span");
    bubble.className = "bubble bubble--dynamic";
    bubble.style.left = `${clientX - rect.left - size / 2}px`;
    bubble.style.top = `${clientY - rect.top - size / 2}px`;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.setProperty("--drift", `${Math.round((Math.random() - 0.5) * 70)}px`);
    bubble.style.setProperty("--dur", `${(1.8 + Math.random() * 1.5).toFixed(2)}s`);
    bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
    heroBubbles.appendChild(bubble);
    while (heroBubbles.children.length > 38) heroBubbles.firstElementChild.remove();
  }
  function burstFromSource(count = 8) {
    const source = activeBubbleSource();
    if (!source || prefersReduced) return;
    const rect = source.getBoundingClientRect();
    for (let i = 0; i < count; i += 1) {
      window.setTimeout(() => {
        spawnBubble(
          rect.left + rect.width * (0.2 + Math.random() * 0.6),
          rect.top + rect.height * (0.12 + Math.random() * 0.5)
        );
      }, i * 55);
    }
  }
  bubbleSources.forEach((source) => {
    source.addEventListener("pointermove", (event) => {
      const now = Date.now();
      if (now - lastPointerBubble < 85) return;
      lastPointerBubble = now;
      spawnBubble(event.clientX, event.clientY);
    }, { passive: true });
    source.addEventListener("click", () => burstFromSource(10));
    source.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        burstFromSource(10);
      }
    });
  });

  /* ── Botones de cada versión: saltan a una sección ──────── */
  $$("[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      const section = target ? document.querySelector(target) : null;
      if (!section) return;
      section.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
      showToast(`${button.textContent.trim()} → sección`);
    });
  });

  /* ── Progreso, header, navegación, parallax y volver arriba ─ */
  const progressBar = $("#progressBar");
  const header = $("#siteHeader");
  const navLinks = $$(".nav__link");
  const sections = $$("main section[id]");
  const toTop = $("#toTop");
  const toTopRing = $("#toTopRing");
  const RING_LENGTH = 2 * Math.PI * 20;
  const parallaxEls = $$("[data-parallax]");

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, y / max) : 0;

    if (progressBar) progressBar.style.width = `${(progress * 100).toFixed(2)}%`;
    header?.classList.toggle("is-scrolled", y > 24);
    if (toTopRing) toTopRing.style.strokeDashoffset = String(RING_LENGTH * (1 - progress));
    toTop?.classList.toggle("is-visible", y > 520);

    if (!prefersReduced) {
      parallaxEls.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0.12;
        el.style.setProperty("--parallax", `${(y * speed).toFixed(1)}px`);
      });
      const heroRect = hero?.getBoundingClientRect();
      const source = activeBubbleSource();
      if (source && heroRect && heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
        const now = Date.now();
        if (now - lastScrollBubble > 160) {
          lastScrollBubble = now;
          const rect = source.getBoundingClientRect();
          spawnBubble(rect.left + rect.width / 2, rect.top + rect.height * 0.35);
        }
      }
    }

    let active = "inicio";
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.35 && rect.bottom > window.innerHeight * 0.35) active = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${active}`);
    });
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }));

  /* ── Menú móvil ──────────────────────────────────────────── */
  const menuToggle = $("#menuToggle");
  const mobileMenu = $("#mobileMenu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    menuToggle?.setAttribute("aria-expanded", String(open));
    menuToggle?.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileMenu?.setAttribute("aria-hidden", String(!open));
  }
  menuToggle?.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

  /* ── Copiar email ────────────────────────────────────────── */
  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy || "";
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const field = document.createElement("textarea");
          field.value = text;
          field.style.position = "fixed";
          field.style.opacity = "0";
          document.body.appendChild(field);
          field.select();
          document.execCommand("copy");
          field.remove();
        }
        showToast("Email copiado");
      } catch {
        showToast(`No se pudo copiar: ${text}`);
      }
    });
  });

  /* ── Comanda: el formulario arma un mailto ────────────────── */
  const orderForms = $$("[data-mailto-form], #orderForm");
  orderForms.forEach((orderForm) => {
    orderForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!orderForm.reportValidity()) return;
      const data = new FormData(orderForm);
      const nombre = String(data.get("nombre") || "").trim();
      const email = String(data.get("email") || "").trim();
      const mensaje = String(data.get("mensaje") || "").trim();
      const subject = `${orderForm.dataset.mailSubject || "Mensaje desde el portafolio"} — ${nombre}`;
      const body = `Hola Guadalupe,\n\n${mensaje}\n\nMi email: ${email}\n\n— ${nombre}`;
      showToast("Mensaje listo: revisá tu app de mail");
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });

  /* ── Stickers y extras interactivos ──────────────────────── */
  function pulseStage(stage) {
    if (!stage) return;
    stage.classList.remove("is-changing");
    void stage.offsetWidth;
    stage.classList.add("is-changing");
  }
  /* ── Stickers y extras interactivos (por versión) ─────────── */
  $$("[data-section-view]").forEach((view) => {
    const skillChips = $$("[data-skill]", view);
    const skillStage = $(".skill-stage", view);
    const skillFocus = $(".skill-focus", view);
    skillChips.forEach((chip, i) => {
      chip.setAttribute("aria-pressed", String(i === 0));
      chip.classList.toggle("is-active", i === 0);
      chip.addEventListener("click", () => {
        skillChips.forEach((item) => {
          const active = item === chip;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        if (skillFocus) skillFocus.textContent = chip.textContent.trim();
        pulseStage(skillStage);
      });
    });

    const softChips = $$("[data-soft]", view);
    const softStage = $(".soft-stage, .soft-focus-wrap", view);
    const softFocus = $(".soft-focus", view);
    softChips.forEach((chip, i) => {
      chip.setAttribute("aria-pressed", String(i === 0));
      chip.classList.toggle("is-active", i === 0);
      chip.addEventListener("click", () => {
        softChips.forEach((item) => {
          const active = item === chip;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        if (softFocus) softFocus.textContent = chip.textContent.trim();
        pulseStage(softStage);
      });
    });
  });

  /* ── Tarjetas del menú: abrir receta con click / teclado ─── */
  $$(".menu-card__toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".menu-card");
      if (!card) return;
      const open = !card.classList.contains("is-open");
      card.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      const icon = button.querySelector("span");
      if (icon) icon.textContent = open ? "−" : "+";
    });
  });

  /* ── Sonido: Marama · Bronceado (apagado por defecto) ────── */
  const SOUND_KEY = "dulce-sound";
  const soundToggle = $("#soundToggle");
  const cumbiaTrack = $("#cumbiaTrack");
  let soundEnabled = false;
  let trackWarned = false;

  function setSound(on, persist = true) {
    soundEnabled = Boolean(on);
    root.dataset.sound = soundEnabled ? "on" : "off";
    soundToggle?.setAttribute("aria-pressed", String(soundEnabled));
    soundToggle?.setAttribute("aria-label", soundEnabled ? "Desactivar sonido y cumbia" : "Activar sonido y cumbia");
    soundToggle?.setAttribute("title", soundEnabled ? "Sonido y cumbia activados" : "Sonido apagado");
    if (persist) {
      try { localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off"); } catch { /* sin persistencia */ }
    }
  }
  function startTrack() {
    if (!cumbiaTrack) return;
    cumbiaTrack.volume = 0.28;
    const playing = cumbiaTrack.play();
    if (playing && typeof playing.catch === "function") {
      playing.catch(() => {
        if (!trackWarned) {
          trackWarned = true;
          showToast("♪ Poné el MP3 en assets/bronceado.mp3.");
        }
      });
    }
  }
  soundToggle?.addEventListener("click", () => {
    if (soundEnabled) {
      setSound(false);
      cumbiaTrack?.pause();
    } else {
      setSound(true);
      startTrack();
    }
  });
  try { soundEnabled = localStorage.getItem(SOUND_KEY) === "on"; } catch { soundEnabled = false; }
  setSound(soundEnabled, false);
  const resumeTrack = () => { if (soundEnabled && cumbiaTrack?.paused) startTrack(); };
  document.addEventListener("pointerdown", resumeTrack, { passive: true });
  document.addEventListener("keydown", resumeTrack);

  /* ── Cursor burbuja + magnetismo + spotlight + tilt ─────── */
  const cursorDot = $("#cursorDot");
  const cursorRing = $("#cursorRing");
  if (cursorDot && cursorRing && !isTouch && !prefersReduced) {
    let targetX = -100, targetY = -100, ringX = -100, ringY = -100;
    const moveCursor = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      cursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(moveCursor);
    };
    window.requestAnimationFrame(moveCursor);
    document.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      document.body.classList.add("cursor-ready");
    }, { passive: true });
    document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-ready"));
    document.addEventListener("mouseenter", () => document.body.classList.add("cursor-ready"));
    $$("a, button, [data-magnetic], .menu-card, .service, .food-btn").forEach((el) => {
      el.addEventListener("pointerenter", () => document.body.classList.add("cursor-hover"));
      el.addEventListener("pointerleave", () => document.body.classList.remove("cursor-hover"));
    });
  }

  if (!prefersReduced && !isTouch) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.22;
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  $$("[data-spotlight]").forEach((el) => {
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      el.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  if (!prefersReduced && !isTouch) {
    const combo = $(".hero__combo");
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--tilt-x", `${(-py * 5).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(px * 7).toFixed(2)}deg`);
        el.classList.add("is-tilting");
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--tilt-x", "0deg");
        el.style.setProperty("--tilt-y", "0deg");
        el.classList.remove("is-tilting");
      });
    });

    const sparks = $$("[data-spark]");
    combo?.addEventListener("pointermove", (event) => {
      const rect = combo.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      sparks.forEach((spark, i) => {
        const depth = (i + 1) * 9;
        spark.style.translate = `${(px * depth).toFixed(1)}px ${(py * depth).toFixed(1)}px`;
      });
    });
    combo?.addEventListener("pointerleave", () => {
      sparks.forEach((spark) => { spark.style.translate = "0 0"; });
    });
  }

  /* ── Paleta de comandos (Ctrl / Cmd + K) ─────────────────── */
  const commandPalette = $("#commandPalette");
  const commandInput = $("#commandInput");
  const commandList = $("#commandList");
  const openPaletteBtn = $("#openPalette");
  const commandItems = [
    ...$$(".nav__link").map((link) => ({ label: link.textContent.trim(), href: link.getAttribute("href"), hint: "Ir" })),
    { label: "Cambiar tema claro / oscuro", href: "#theme", hint: "Tema" },
    { label: "Elegir versión del portafolio", href: "#skins", hint: "Versiones" },
    { label: "Versión formal / perfil profesional", href: "#skin-formal", hint: "Versión" },
    { label: "Versión elegancia dorada", href: "#skin-elegance", hint: "Versión" },
    { label: "Versión Juegos / mundo original", href: "#skin-games", hint: "Versión" },
    { label: "Versión comida / Coca-Cola", href: "#skin-diner", hint: "Versión" },
    { label: "Versión programación / terminal", href: "#skin-dev", hint: "Versión" },
    { label: "Color rosa chicle", href: "#accent-pink", hint: "Color" },
    { label: "Color amarillo pastel", href: "#accent-yellow", hint: "Color" },
    { label: "Color celeste eléctrico", href: "#accent-cyan", hint: "Color" },
    { label: "Color marrón chocolate", href: "#accent-brown", hint: "Color" },
    { label: "Descargar CV", href: "assets/cv.pdf", hint: "PDF" },
    { label: "Instagram · @guada_arrieta35", href: "https://www.instagram.com/guada_arrieta35", hint: "Red" },
    { label: "Gmail · guadaarrieta120321@gmail.com", href: "mailto:guadaarrieta120321@gmail.com", hint: "Mail" },
    { label: "WhatsApp · +54 9 11 2277-9285", href: "https://wa.me/5491122779285", hint: "Chat" },
    { label: "GitHub", href: "https://github.com/guada120321", hint: "Red" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/guadalupe-arrieta-17aa6a364", hint: "Red" },
  ];
  let selectedCommand = 0;
  let filteredCommands = [];

  function renderCommands(filter = "") {
    if (!commandList) return;
    const query = filter.trim().toLowerCase();
    filteredCommands = commandItems.filter((item) => item.label.toLowerCase().includes(query));
    commandList.replaceChildren();
    if (!filteredCommands.length) {
      const empty = document.createElement("li");
      empty.className = "command__empty";
      empty.textContent = "Sin resultados.";
      commandList.appendChild(empty);
      return;
    }
    filteredCommands.forEach((item, index) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      if (index === selectedCommand) button.className = "is-selected";
      const label = document.createElement("span");
      label.textContent = item.label;
      const hint = document.createElement("small");
      hint.textContent = item.hint;
      button.append(label, hint);
      button.addEventListener("click", () => goToCommand(item.href));
      li.appendChild(button);
      commandList.appendChild(li);
    });
  }
  function openCommandPalette() {
    if (!commandPalette) return;
    selectedCommand = 0;
    if (commandInput) commandInput.value = "";
    renderCommands();
    commandPalette.classList.add("is-open");
    commandPalette.setAttribute("aria-hidden", "false");
    window.setTimeout(() => commandInput?.focus(), 0);
  }
  function closeCommandPalette() {
    commandPalette?.classList.remove("is-open");
    commandPalette?.setAttribute("aria-hidden", "true");
  }
  function goToCommand(href) {
    closeCommandPalette();
    if (href === "#theme") {
      themeToggle?.click();
    } else if (href === "#skins") {
      openSkinPanel();
    } else if (href.startsWith("#skin-")) {
      setSkin(href.replace("#skin-", ""));
    } else if (href.startsWith("#accent-")) {
      setAccent(href.replace("#accent-", ""));
    } else if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    } else {
      window.open(href, "_blank", "noopener");
    }
  }
  function moveCommandSelection(delta) {
    if (!filteredCommands.length) return;
    selectedCommand = (selectedCommand + delta + filteredCommands.length) % filteredCommands.length;
    renderCommands(commandInput?.value || "");
  }
  openPaletteBtn?.addEventListener("click", openCommandPalette);
  commandPalette?.querySelector("[data-close-command]")?.addEventListener("click", closeCommandPalette);
  commandInput?.addEventListener("input", () => {
    selectedCommand = 0;
    renderCommands(commandInput.value);
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (commandPalette?.classList.contains("is-open")) closeCommandPalette();
      else openCommandPalette();
      return;
    }
    if (!commandPalette?.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeCommandPalette();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveCommandSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveCommandSelection(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filteredCommands[selectedCommand];
      if (item) goToCommand(item.href);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSkinPanel();
      setMenu(false);
    }
  });

  /* ── Guiños escondidos ───────────────────────────────────── */
  let keys = "";
  document.addEventListener("keydown", (event) => {
    if (event.key.length !== 1) return;
    if (/^(INPUT|TEXTAREA)$/i.test(document.activeElement?.tagName || "")) return;
    keys = `${keys}${event.key.toLowerCase()}`.slice(-12);
    if (keys.includes("cumbia")) {
      showToast("♪ Marama & Rombai · cumbia cheta + Coca bien fría");
      keys = "";
    }
  });
  let brandClicks = 0;
  let brandTimer;
  $("#brand")?.addEventListener("click", () => {
    brandClicks += 1;
    window.clearTimeout(brandTimer);
    brandTimer = window.setTimeout(() => { brandClicks = 0; }, 700);
    if (brandClicks === 3) {
      showToast("AG · 18 · 35");
      brandClicks = 0;
    }
  });


  /* ── V2: voz y etiquetas según la versión elegida ─────────── */
  function updateSkinCopy(skin) {
    const copy = {
      diner: {
        brand: "AG's <b>Diner</b>",
        loader: "AG's <b>DINER</b>",
        loaderSub: "sirviendo código... 🍬",
        nav: ["Inicio", "Ingredientes", "La carta", "El menú", "Extras", "Pedido"],
        scroll: "Deslizá",
        tech: "HTML · CSS · JavaScript · SQL · MySQL · cumbia cheta · hecho a mano",
        title: "Elegí tu versión",
      },
      formal: {
        brand: "Arrieta <b>Guadalupe</b>",
        loader: "AG <b>· PORTAFOLIO</b>",
        loaderSub: "cargando perfil profesional...",
        nav: ["Inicio", "Perfil", "Servicios", "Proyectos", "Habilidades", "Contacto"],
        scroll: "Continuar",
        tech: "HTML · CSS · JavaScript · SQL · MySQL · documentación y código limpio",
        title: "Perfil profesional",
      },
      elegance: {
        brand: "Arrieta <b>· Guadalupe</b>",
        loader: "AG <b>· EDICIÓN</b>",
        loaderSub: "preparando una presentación cuidada...",
        nav: ["Inicio", "Perfil", "Ámbitos", "Obra", "Competencias", "Contacto"],
        scroll: "Avanzar",
        tech: "HTML · CSS · JavaScript · SQL · MySQL · detalle, criterio y buen gusto",
        title: "Edición elegancia",
      },
      games: {
        brand: "Mundo <b>Arrieta</b>",
        loader: "AG <b>· MUNDO</b>",
        loaderSub: "cargando nivel... presá comenzar",
        nav: ["Inicio", "Sobre mí", "Servicios", "Proyectos", "Habilidades", "Contacto"],
        scroll: "Seguir",
        tech: "HTML · CSS · JavaScript · SQL · MySQL · monedas, mejoras y cumbia cheta",
        title: "Mundo Arrieta",
      },
      dev: {
        brand: "guada@<b>portafolio</b>",
        loader: "AG <b>:: INICIO</b>",
        loaderSub: "$ iniciar portafolio",
        nav: ["Inicio", "Perfil", "Módulos", "Proyectos", "Habilidades", "Contacto"],
        scroll: "Continuar",
        tech: "HTML · CSS · JavaScript · SQL · MySQL · git · cambios claros",
        title: "Programación · terminal",
      },
    }[skin] || null;
    if (!copy) return;

    const site = $("#dulceSite") || document;
    const rawHref = (link) => (link.getAttribute("data-original-href") || link.getAttribute("href") || "").split("#").pop();
    $$(".brand__name", site).forEach((el) => { el.innerHTML = copy.brand; });
    $$(".preloader__sign").forEach((el) => { el.innerHTML = copy.loader; });
    $$(".preloader__sub").forEach((el) => { el.textContent = copy.loaderSub; });
    $$(".nav__link").filter((el) => !el.closest("#marioOriginal")).forEach((el, i) => {
      if (copy.nav[i]) el.textContent = copy.nav[i];
    });

    const byId = { inicio: 0, "sobre-mi": 1, servicios: 2, proyectos: 3, habilidades: 4, contacto: 5 };
    $$(".mobile-menu nav a, .site-footer__top nav a").filter((el) => !el.closest("#marioOriginal")).forEach((link) => {
      if (!link.hasAttribute("data-original-href")) link.setAttribute("data-original-href", link.getAttribute("href"));
      const i = byId[rawHref(link)];
      if (i === undefined || !copy.nav[i]) return;
      const number = $("span:first-child", link);
      if (number) {
        const rest = Array.from(link.childNodes).find((node) => node.nodeType === 3 && node.textContent.trim());
        if (rest) rest.textContent = " " + copy.nav[i];
        else link.insertAdjacentText("beforeend", " " + copy.nav[i]);
      } else {
        link.textContent = copy.nav[i];
      }
    });

    const scrollLabel = $(".scroll-cue > span:first-child", site);
    if (scrollLabel) scrollLabel.textContent = copy.scroll;
    const footerTech = $(".site-footer__tech", site);
    if (footerTech) footerTech.textContent = copy.tech;
    document.title = `Arrieta Guadalupe — Técnica en Programación | ${copy.title}`;
  }

  /* ── V2: carruseles con personalidad por versión ──────────── */
  function renderCarousels() { initCarousels(); }
  function initCarousels() {
    $$("[data-carousel]").forEach((shell) => {
      if (shell.dataset.carouselReady === "true") return;
      shell.dataset.carouselReady = "true";
      const slides = $$("[data-carousel-slide]", shell);
      if (!slides.length) return;
      const dotsBox = $("[data-carousel-dots]", shell);
      const countEl = $("[data-carousel-count]", shell);
      const progress = $("[data-carousel-progress]", shell);
      const prev = $("[data-carousel-prev]", shell);
      const next = $("[data-carousel-next]", shell);
      const pad = (n) => String(n).padStart(2, "0");
      let index = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));

      const dots = slides.map((slide, i) => {
        if (!dotsBox) return null;
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", `Ir al elemento ${i + 1}`);
        dot.addEventListener("click", () => show(i));
        dotsBox.appendChild(dot);
        return dot;
      });

      function show(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
        dots.forEach((dot, i) => {
          if (!dot) return;
          dot.classList.toggle("is-active", i === index);
          dot.setAttribute("aria-current", String(i === index));
        });
        shell.style.setProperty("--slide-index", String(index));
        if (countEl) countEl.textContent = pad(index + 1);
        if (progress) progress.style.width = `${((index + 1) / slides.length) * 100}%`;
      }

      prev?.addEventListener("click", () => show(index - 1));
      next?.addEventListener("click", () => show(index + 1));
      shell.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); show(index - 1); }
        if (event.key === "ArrowRight") { event.preventDefault(); show(index + 1); }
      });

      if (shell.dataset.draggable === "true" && !prefersReduced) {
        let startX = null;
        const viewport = $(".carousel-viewport", shell);
        viewport?.addEventListener("pointerdown", (event) => { startX = event.clientX; viewport.classList.add("is-dragging"); });
        viewport?.addEventListener("pointerup", (event) => {
          viewport.classList.remove("is-dragging");
          if (startX === null) return;
          const delta = event.clientX - startX;
          if (Math.abs(delta) > 45) show(index + (delta < 0 ? 1 : -1));
          startX = null;
        });
        viewport?.addEventListener("pointercancel", () => { viewport.classList.remove("is-dragging"); startX = null; });
      }

      show(index);
    });
  }

  /* ── V2: pestañas de ítems en Arrieta World ───────────────── */
  function initTabs() {
    $$("[data-tab-group]").forEach((group) => {
      if (group.dataset.tabsReady === "true") return;
      group.dataset.tabsReady = "true";
      const tabs = $$("[data-tab]", group);
      const panels = $$("[data-tab-panel]", group);
      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t, j) => {
            t.classList.toggle("is-active", i === j);
            t.setAttribute("aria-selected", String(i === j));
            t.tabIndex = i === j ? 0 : -1;
          });
          panels.forEach((panel, j) => {
            panel.classList.toggle("is-active", i === j);
            panel.hidden = i !== j;
          });
        });
        tab.addEventListener("keydown", (event) => {
          const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
          if (!keys.includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
            event.key === "ArrowRight" || event.key === "ArrowDown" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
          tabs[next].focus();
          tabs[next].click();
        });
      });
    });
  }

  /* Tarjetas dinámicas de "Tres disciplinas" (Elegancia). */
  function initDynamicCards() {
    const cards = $$("[data-dynamic-card]");
    if (!cards.length || cards[0].dataset.dynamicReady === "true") return;
    cards.forEach((card) => {
      card.dataset.dynamicReady = "true";
      card.addEventListener("click", () => {
        cards.forEach((other) => {
          const active = other === card && !other.classList.contains("is-active");
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-expanded", String(active));
        });
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); card.click(); }
      });
    });
  }

  /* ── Capa original de Mundo Arrieta ( Juegos ) ───────── */
  function initMario() {
    if (marioReady || !marioLayer) return;
    marioReady = true;
    const layer = marioLayer;

    const typeEl = $("#marioTypewriter", layer);
    if (typeEl) {
      const phrases = ["Técnica en Programación", "Interfaces con detalle", "Lógica clara y datos"];
      if (prefersReduced) {
        typeEl.textContent = phrases[0];
      } else {
        let phraseIndex = 0, charIndex = 0, deleting = false;
        const type = () => {
          const phrase = phrases[phraseIndex];
          charIndex += deleting ? -1 : 1;
          typeEl.textContent = phrase.slice(0, charIndex);
          if (!deleting && charIndex === phrase.length) { deleting = true; window.setTimeout(type, 1800); return; }
          if (deleting && charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            window.setTimeout(type, 380);
            return;
          }
          window.setTimeout(type, deleting ? 34 : 68);
        };
        window.setTimeout(type, 700);
      }
    }

    const mTabs = $$(".tab", layer);
    const mPanels = $$(".tab-panel", layer);
    const animateBars = (panel) => {
      if (!panel) return;
      $$(".skill__bar span", panel).forEach((bar, i) => {
        const level = bar.dataset.level || "0";
        if (prefersReduced) { bar.style.transition = "none"; bar.style.width = level + "%"; return; }
        bar.style.width = "0%";
        window.setTimeout(() => { bar.style.width = level + "%"; }, 60 + i * 70);
      });
    };
    const activateMarioTab = (tab) => {
      mTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
      });
      mPanels.forEach((panel) => {
        const active = panel.dataset.panel === tab.dataset.tab;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
        if (active) animateBars(panel);
      });
    };
    mTabs.forEach((tab, i) => {
      tab.addEventListener("click", () => activateMarioTab(tab));
      tab.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (i + 1) % mTabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (i - 1 + mTabs.length) % mTabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = mTabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        mTabs[next].focus();
        activateMarioTab(mTabs[next]);
      });
    });

    const viewport = $("#carouselViewport", layer);
    const track = $("#marioCarouselTrack", layer);
    if (viewport && track) {
      const slides = $$(".project-card", track);
      const total = slides.length;
      const dotsWrap = $("#carouselDots", layer);
      const currentEl = $("#currentSlide", layer);
      const totalEl = $("#totalSlides", layer);
      const progressEl = $("#carouselProgress", layer);
      const pad = (n) => String(n).padStart(2, "0");
      let index = 0;
      let timer = null;

      if (totalEl) totalEl.textContent = pad(total);
      dotsWrap?.replaceChildren();
      const dots = slides.map((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Ir al proyecto ${i + 1}`);
        dot.addEventListener("click", () => { goTo(i); stop(); });
        dotsWrap?.appendChild(dot);
        return dot;
      });
      const render = () => {
        track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
        dots.forEach((dot, i) => {
          dot.classList.toggle("is-active", i === index);
          dot.setAttribute("aria-current", String(i === index));
        });
        if (currentEl) currentEl.textContent = pad(index + 1);
        if (progressEl) progressEl.style.width = `${((index + 1) / total) * 100}%`;
        slides.forEach((slide, i) => {
          slide.setAttribute("aria-hidden", String(i !== index));
          slide.inert = i !== index;
        });
      };
      function goTo(i) { index = (i + total) % total; render(); }
      function stop() { if (timer) window.clearInterval(timer); timer = null; }
      function start() { if (!prefersReduced && total > 1) timer = window.setInterval(() => goTo(index + 1), 6800); }

      $("#prevProject", layer)?.addEventListener("click", () => { goTo(index - 1); stop(); });
      $("#nextProject", layer)?.addEventListener("click", () => { goTo(index + 1); stop(); });
      viewport.tabIndex = 0;
      viewport.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        goTo(index + (event.key === "ArrowRight" ? 1 : -1));
        stop();
      });
      let startX = null;
      viewport.addEventListener("pointerdown", (event) => { startX = event.clientX; });
      viewport.addEventListener("pointerup", (event) => {
        if (startX === null) return;
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 45) { goTo(index + (delta < 0 ? 1 : -1)); stop(); }
        startX = null;
      });

      render();
      start();
    }

    const marioYear = $("#marioYear", layer);
    if (marioYear) marioYear.textContent = String(new Date().getFullYear());
    const activePanel = $(".tab-panel.is-active", layer);
    if (activePanel) animateBars(activePanel);
  }

  renderCarousels();

  /* ── Año del footer ──────────────────────────────────────── */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  const marioYear = $("#marioYear");
  if (marioYear) marioYear.textContent = String(new Date().getFullYear());
})();
