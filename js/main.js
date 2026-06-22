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
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

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

  // Barra de progreso — reusar si ya existe (F5 reload con DOM cacheado)
  let progressBar = document.querySelector('.valores__progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'valores__progress';
    document.querySelector('.valores')?.appendChild(progressBar);
  }

  const goTo = (index) => {
    currentSlide = (index + SLIDE_COUNT) % SLIDE_COUNT;
    valoresSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
    valoresDots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));

    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progressBar.style.transition = `width ${AUTO_DELAY}ms linear`;
        progressBar.style.width = '100%';
      });
    });
  };

  const startAuto = () => {
    if (globalAutoTimer) clearInterval(globalAutoTimer);
    globalAutoTimer = setInterval(() => goTo(currentSlide + 1), AUTO_DELAY);
  };

  prevBtn?.addEventListener('click', () => { goTo(currentSlide - 1); startAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(currentSlide + 1); startAuto(); });
  valoresDots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startAuto(); });
  });

  let touchStartX = 0;
  document.querySelector('.valores')?.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.querySelector('.valores')?.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { goTo(currentSlide + (diff > 0 ? 1 : -1)); startAuto(); }
  });

  document.querySelector('.valores')?.addEventListener('mouseenter', () => clearInterval(globalAutoTimer));
  document.querySelector('.valores')?.addEventListener('mouseleave', () => startAuto());

  goTo(0);
  startAuto();

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

    let lastFrame = -1;

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
      if (frames[i] && frames[i].complete) ctx.drawImage(frames[i], 0, 0);
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

    // Frame 0 primero — inicia canvas en cuanto carga; resto en background
    loadFrameImg(0).then(img => {
      if (!img) return;
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
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

  /* ---- CURSOR: efecto pulido / lijado (solo desktop, toda la web) ---- */
  (() => {
    // Desactivar en touch/mobile (sin mouse real)
    if (window.matchMedia('(hover: none)').matches) return;

    // ─── CONFIG — editá estos valores para ajustar el efecto ───────────────
    const LERP       = 0.13;            // suavidad del ring (0=más lag, 1=instantáneo)
    const P_COUNT    = 4;               // partículas por evento
    const P_LIFE     = 420;             // ms que vive cada partícula
    const P_SPREAD   = 22;              // px — radio de dispersión al nacer
    const P_COLOR    = [212, 188, 158]; // RGB color del polvo de madera
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
    document.querySelectorAll('a, button, .curso-card, .valores__slide').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    });
  })();

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

});
