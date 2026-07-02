/* =============================================
   RAIZ — Main JS
   ============================================= */

// Globales de control — se limpian antes de cada re-init para que F5
// no acumule intervalos y RAF callbacks del ciclo anterior
let globalScrollRafId  = null;
let globalAutoTimer    = null;
let globalProcesoTimer = null;

document.addEventListener('DOMContentLoaded', () => {

  /* ---- NAV: scroll effect ---- */
  const nav = document.querySelector('.nav');

  /* ---- NAV: hamburger mobile ---- */
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');
  const mobileLinks = mobileNav?.querySelectorAll('a');
  let isMenuOpen = false;

  hamburger?.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    mobileNav.classList.toggle('open', isMenuOpen);
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    const spans = hamburger.querySelectorAll('span');
    if (isMenuOpen) {
      spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  mobileLinks?.forEach(link => {
    link.addEventListener('click', () => {
      isMenuOpen = false;
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });

  /* ---- HERO: text line reveal ---- */
  const heroLines = document.querySelectorAll('.hero__title .line span');
  const heroSub = document.querySelector('.hero__sub');
  const heroActions = document.querySelector('.hero__actions');

  setTimeout(() => {
    heroLines.forEach((span, i) => {
      setTimeout(() => span.classList.add('visible'), i * 120);
    });
  }, 200);

  setTimeout(() => {
    heroSub?.classList.add('visible');
    heroActions?.classList.add('visible');
  }, 400);

  /* ---- SCROLL REVEAL: IntersectionObserver ---- */
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  revealEls.forEach(el => observer.observe(el));

  /* ---- TICKER: duplicate for seamless loop ---- */
  const tickerTrack = document.querySelector('.ticker__track');
  if (tickerTrack && !tickerTrack.parentElement.querySelector('[aria-hidden="true"]')) {
    const clone = tickerTrack.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    tickerTrack.parentElement.appendChild(clone);
  }

  /* ---- VALORES SLIDER ---- */
  const valoresSlider = document.querySelector('.valores__slider');
  const valoresDots   = document.querySelectorAll('.valores__dot');
  const prevBtn       = document.querySelector('.valores__arrow--prev');
  const nextBtn       = document.querySelector('.valores__arrow--next');
  const SLIDE_COUNT   = 3;
  const AUTO_DELAY    = 5000;
  let currentSlide    = 0;

  const goTo = (index) => {
    currentSlide = (index + SLIDE_COUNT) % SLIDE_COUNT;
    valoresSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
    valoresDots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  };

  const startAuto = () => {
    if (globalAutoTimer) clearInterval(globalAutoTimer);
    globalAutoTimer = setInterval(() => goTo(currentSlide + 1), AUTO_DELAY);
  };

  prevBtn?.addEventListener('click', () => goTo(currentSlide - 1));
  nextBtn?.addEventListener('click', () => goTo(currentSlide + 1));
  valoresDots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  let touchStartX = 0;
  document.querySelector('.valores')?.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.querySelector('.valores')?.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(currentSlide + (diff > 0 ? 1 : -1));
  });

  goTo(0);

  /* ---- COUNTER ANIMATION ---- */
  const statNumbers = document.querySelectorAll('[data-count]');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const start = performance.now();

        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(eased * target);
          el.querySelector('.count-value').textContent = value + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => countObserver.observe(el));

  /* ---- CANVAS FRAME SCRUBBING ---- */
  const heroScrollContainer = document.querySelector('.hero-scroll-container');
  const heroVideo = document.querySelector('.hero__video');
  const TOTAL_FRAMES = 120;
  const frames = new Array(TOTAL_FRAMES);

  if (heroScrollContainer && window.innerWidth > 768) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;';
    if (heroVideo) heroVideo.replaceWith(canvas);
    else document.querySelector('.hero').prepend(canvas);
    const ctx = canvas.getContext('2d');
    const heroEl = document.querySelector('.hero');

    let lastFrame = -1;

    const resizeCanvas = () => {
      canvas.width  = heroEl.offsetWidth;
      canvas.height = heroEl.offsetHeight;
      if (lastFrame >= 0 && frames[lastFrame]) drawFrameCover(lastFrame);
    };

    const drawFrameCover = (i) => {
      const img = frames[i];
      if (!img || !img.complete) return;
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.min(cw / iw, ch / ih);
      const sw = iw * scale, sh = ih * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, cw - sw, (ch - sh) / 2, sw, sh);
    };

    const loadFrameImg = (i) => new Promise((resolve) => {
      const img = new Image();
      const num = String(i).padStart(4, '0');
      img.src = `assets/frames/frame-${num}.jpg`;
      if (img.complete) {
        frames[i] = img;
        resolve(img);
      } else {
        img.onload  = () => { frames[i] = img; resolve(img); };
        img.onerror = () => resolve(null);
      }
    });

    const drawFrame = (index) => {
      const i = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
      if (i === lastFrame) return;
      lastFrame = i;
      drawFrameCover(i);
    };

    const scrub = () => {
      const rect = heroScrollContainer.getBoundingClientRect();
      const scrollable = heroScrollContainer.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      drawFrame(Math.round(progress * (TOTAL_FRAMES - 1)));
      globalScrollRafId = null;
    };

    window.addEventListener('scroll', () => {
      if (!globalScrollRafId) globalScrollRafId = requestAnimationFrame(scrub);
    }, { passive: true });

    window.addEventListener('resize', resizeCanvas);

    // Frame 0 primero — inicia canvas en cuanto carga; resto en background
    loadFrameImg(0).then(img => {
      if (!img) return;
      resizeCanvas();
      drawFrameCover(0);
      lastFrame = 0;
    });
    for (let i = 1; i < TOTAL_FRAMES; i++) loadFrameImg(i);

    scrub();
  }

  /* ---- SMOOTH hover cursor trail on hero ---- */
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--mx', x + '%');
      hero.style.setProperty('--my', y + '%');
    });
  }

  /* ---- ERGONOMÍA: parallax blueprint ---- */
  const ergoStage = document.querySelector('#ergoStage');
  if (ergoStage && !window.matchMedia('(hover: none)').matches) {
    const ergoLayers = ergoStage.querySelectorAll('.ergo__layer[data-depth]');
    let ergoMx = 0, ergoMy = 0, ergoRaf = null;

    const ergoUpdate = () => {
      ergoLayers.forEach(layer => {
        const d = parseFloat(layer.dataset.depth) || 0;
        layer.style.transform = `translate3d(${ergoMx * d * 26}px, ${ergoMy * d * 16}px, 0)`;
      });
      ergoRaf = null;
    };

    ergoStage.addEventListener('mousemove', (e) => {
      const r = ergoStage.getBoundingClientRect();
      ergoMx = ((e.clientX - r.left)  / r.width  - 0.5) * 2;
      ergoMy = ((e.clientY - r.top)   / r.height - 0.5) * 2;
      if (!ergoRaf) ergoRaf = requestAnimationFrame(ergoUpdate);
    }, { passive: true });

    ergoStage.addEventListener('mouseleave', () => {
      ergoMx = 0; ergoMy = 0;
      ergoLayers.forEach(l => {
        l.style.transition = 'transform 0.9s var(--ease-out)';
        l.style.transform  = 'translate3d(0,0,0)';
      });
      setTimeout(() => ergoLayers.forEach(l => l.style.transition = ''), 900);
    });
  }

  /* ---- CURSOR: efecto pulido / lijado (solo desktop, toda la web) ---- */
  (() => {
    // Desactivar en touch/mobile (sin mouse real)
    if (window.matchMedia('(hover: none)').matches) return;

    // ─── CONFIG — editá estos valores para ajustar el efecto ───────────────
    const LERP       = 0.13;            // suavidad del ring (0=más lag, 1=instantáneo)
    const P_COUNT    = 4;               // partículas por evento
    const P_LIFE     = 420;             // ms que vive cada partícula
    const P_SPREAD   = 22;              // px — radio de dispersión al nacer
    const P_COLOR    = [115, 68, 32];   // RGB color del polvo de madera
    const P_THROTTLE = 30;              // ms mínimo entre tandas de partículas
    // ───────────────────────────────────────────────────────────────────────

    // Crear elementos
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);

    const cvs = document.createElement('canvas');
    cvs.className = 'cursor-canvas';
    document.body.appendChild(cvs);
    const pCtx = cvs.getContext('2d');

    const resizeCvs = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resizeCvs();
    window.addEventListener('resize', resizeCvs, { passive: true });

    // Estado
    let mx = -300, my = -300, rx = -300, ry = -300;
    let rafRunning = false;
    let lastSpawn = 0;
    const grains = [];

    // Partícula individual (viruta / polvo de madera)
    class Grain {
      constructor(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * P_SPREAD;
        this.x  = x + Math.cos(angle) * dist * 0.3;
        this.y  = y + Math.sin(angle) * dist * 0.3;
        this.vx = Math.cos(angle) * (0.12 + Math.random() * 0.28);
        this.vy = Math.sin(angle) * (0.12 + Math.random() * 0.28);
        this.alpha = 0.3 + Math.random() * 0.28;
        this.r    = 0.5 + Math.random() * 1.1;
        this.born = performance.now();
      }
      draw(now) {
        const t = (now - this.born) / P_LIFE;
        if (t >= 1) return false;
        this.x += this.vx;
        this.y += this.vy;
        pCtx.globalAlpha = this.alpha * (1 - t * t * t);
        pCtx.fillStyle = `rgb(${P_COLOR.join(',')})`;
        pCtx.beginPath();
        pCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        pCtx.fill();
        return true;
      }
    }

    // RAF loop — siempre activo mientras haya mouse o partículas
    const loop = () => {
      rx += (mx - rx) * LERP;
      ry += (my - ry) * LERP;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;

      pCtx.clearRect(0, 0, cvs.width, cvs.height);
      const now = performance.now();
      for (let i = grains.length - 1; i >= 0; i--) {
        if (!grains[i].draw(now)) grains.splice(i, 1);
      }
      pCtx.globalAlpha = 1;
      requestAnimationFrame(loop);
    };

    // Spawn partículas (throttleado)
    const spawn = (x, y) => {
      const now = performance.now();
      if (now - lastSpawn < P_THROTTLE) return;
      lastSpawn = now;
      for (let i = 0; i < P_COUNT; i++) grains.push(new Grain(x, y));
    };

    // Activar con el primer movimiento del mouse
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;

      if (!rafRunning) {
        rafRunning = true;
        ring.classList.add('active');
        document.documentElement.classList.add('raiz-cursor-active');
        loop();
      }

      spawn(mx, my);
    }, { passive: true });

    // Ocultar ring cuando el mouse sale de la ventana
    document.addEventListener('mouseleave', () => ring.classList.remove('active'));
    document.addEventListener('mouseenter', () => ring.classList.add('active'));

    // Agrandar ring sobre elementos interactivos
    document.querySelectorAll('a, button, .curso-card, .valores__slide, img').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    });
  })();

  /* ---- TYPEWRITER: cita nosotros ---- */
  const twEl = document.querySelector('.typewriter-text');
  if (twEl) {
    const TEXT       = '"Restaurar no es volver atrás, es darle una nueva oportunidad al origen."';
    const TYPE_SPD   = 42;
    const ERASE_SPD  = 18;
    const PAUSE_END  = 5000;
    const PAUSE_START = 400;
    let i = 0, typing = true;

    const tick = () => {
      if (typing) {
        twEl.textContent = TEXT.slice(0, i + 1);
        i++;
        if (i >= TEXT.length) { typing = false; setTimeout(tick, PAUSE_END); return; }
        setTimeout(tick, TYPE_SPD);
      } else {
        twEl.textContent = TEXT.slice(0, i - 1);
        i--;
        if (i <= 0) { typing = true; setTimeout(tick, PAUSE_START); return; }
        setTimeout(tick, ERASE_SPD);
      }
    };
    setTimeout(tick, 900);
  }

  /* ---- PILARES VIDEO: crossfade loop ---- */
  const vidA = document.querySelector('.pilares__video--a');
  const vidB = document.querySelector('.pilares__video--b');

  if (vidA && vidB) {
    const XFADE = 2.5; // segundos de solapamiento
    let active   = vidA;
    let standby  = vidB;
    let crossing = false;

    const startCrossfade = () => {
      if (crossing) return;
      crossing = true;

      standby.currentTime = 0;
      standby.play().catch(() => {});
      standby.style.opacity = '1';
      active.style.opacity  = '0';

      setTimeout(() => {
        active.pause();
        active.style.transition = 'none';
        active.style.opacity = '0';
        requestAnimationFrame(() => { active.style.transition = ''; });
        [active, standby] = [standby, active];
        crossing = false;
      }, (XFADE + 0.3) * 1000);
    };

    [vidA, vidB].forEach(vid => {
      vid.addEventListener('timeupdate', () => {
        if (vid !== active || crossing || !vid.duration) return;
        if (vid.duration - vid.currentTime < XFADE) startCrossfade();
      });
    });
  }

  /* ---- PROCESO expanding tabs ---- */
  const procesoTabs = document.querySelectorAll('.proceso__tab');

  if (procesoTabs.length) {
    let procesoIdx = 0;

    const procesoGoTo = (idx) => {
      procesoIdx = ((idx % procesoTabs.length) + procesoTabs.length) % procesoTabs.length;
      procesoTabs.forEach((t, i) => t.classList.toggle('active', i === procesoIdx));
    };

    const procesoStartAuto = () => {
      if (globalProcesoTimer) clearInterval(globalProcesoTimer);
      globalProcesoTimer = setInterval(() => procesoGoTo(procesoIdx + 1), 4000);
    };

    procesoTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        if (i !== procesoIdx) { procesoGoTo(i); procesoStartAuto(); }
      });
    });

    const procesoSection = document.querySelector('.proceso__tabs');
    procesoSection?.addEventListener('mouseenter', () => clearInterval(globalProcesoTimer));
    procesoSection?.addEventListener('mouseleave', procesoStartAuto);

    procesoGoTo(0);
    procesoStartAuto();
  }

  /* ---- TIPOS DE MADERA — expanding tabs ---- */
  const maderaTabs = document.querySelectorAll('.madera__tab');

  if (maderaTabs.length) {
    let maderaIdx = 0;

    const maderaGoTo = (idx) => {
      maderaIdx = ((idx % maderaTabs.length) + maderaTabs.length) % maderaTabs.length;
      maderaTabs.forEach((t, i) => t.classList.toggle('active', i === maderaIdx));
    };

    let maderaTimer = setInterval(() => maderaGoTo(maderaIdx + 1), 4000);

    maderaTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        if (i !== maderaIdx) {
          maderaGoTo(i);
          clearInterval(maderaTimer);
          maderaTimer = setInterval(() => maderaGoTo(maderaIdx + 1), 4000);
        }
      });
    });

    const maderaSection = document.querySelector('.madera__tabs');
    maderaSection?.addEventListener('mouseenter', () => clearInterval(maderaTimer));
    maderaSection?.addEventListener('mouseleave', () => {
      clearInterval(maderaTimer);
      maderaTimer = setInterval(() => maderaGoTo(maderaIdx + 1), 4000);
    });

    maderaGoTo(0);
  }

  /* ---- MAGNIFIER — lupa sobre anatomía del mueble ---- */
  const magnifierStage = document.getElementById('magnifierStage');
  const magnifierReveal = document.getElementById('magnifierReveal');
  const magnifierRing = document.getElementById('magnifierRing');

  if (magnifierStage && magnifierReveal && magnifierRing) {
    const R = 170; // radio de la lupa en px

    let rafId = null;
    let mouseX = 0, mouseY = 0;

    magnifierStage.addEventListener('mouseenter', () => {
      magnifierRing.style.opacity = '1';
    });

    magnifierStage.addEventListener('mouseleave', () => {
      magnifierRing.style.opacity = '0';
      magnifierReveal.style.clipPath = 'circle(0px at -9999px -9999px)';
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    });

    magnifierStage.addEventListener('mousemove', (e) => {
      const rect = magnifierStage.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          magnifierReveal.style.clipPath = `circle(${R}px at ${mouseX}px ${mouseY}px)`;
          magnifierRing.style.left = mouseX + 'px';
          magnifierRing.style.top  = mouseY + 'px';
          rafId = null;
        });
      }
    });
  }

  /* ---- MAGNIFIER: botones revelar/ocultar (mobile) ---- */
  const revealBtn = document.getElementById('magnifierRevealBtn');
  const hideBtn   = document.getElementById('magnifierHideBtn');
  if (revealBtn && magnifierStage) {
    revealBtn.addEventListener('click', () => magnifierStage.classList.add('revealed'));
  }
  if (hideBtn && magnifierStage) {
    hideBtn.addEventListener('click', () => magnifierStage.classList.remove('revealed'));
  }

  /* ---- PAGE TRANSITION — salida hacia páginas de curso ---- */
  const pt = document.querySelector('.page-transition');
  if (pt) {
    document.querySelectorAll('a[href^="curso-"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const dest = link.href;
        pt.classList.add('pt-entering');
        setTimeout(() => { window.location.href = dest; }, 750);
      });
    });
  }

});
