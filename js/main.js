/* =============================================
   RAIZ — Main JS
   ============================================= */

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
  if (tickerTrack) {
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
  let autoTimer       = null;

  // Barra de progreso
  const progressBar = document.createElement('div');
  progressBar.className = 'valores__progress';
  document.querySelector('.valores')?.appendChild(progressBar);

  const goTo = (index) => {
    currentSlide = (index + SLIDE_COUNT) % SLIDE_COUNT;
    valoresSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
    valoresDots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));

    // Reset + animar barra de progreso
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
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(currentSlide + 1), AUTO_DELAY);
  };

  const resetAuto = () => { startAuto(); };

  prevBtn?.addEventListener('click', () => { goTo(currentSlide - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(currentSlide + 1); resetAuto(); });
  valoresDots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
  });

  // Swipe touch
  let touchStartX = 0;
  document.querySelector('.valores')?.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.querySelector('.valores')?.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { goTo(currentSlide + (diff > 0 ? 1 : -1)); resetAuto(); }
  });

  // Pausar en hover
  document.querySelector('.valores')?.addEventListener('mouseenter', () => clearInterval(autoTimer));
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
  const frames = [];
  let framesLoaded = 0;
  let canvas, ctx;

  if (heroScrollContainer && window.innerWidth > 768) {
    // Reemplazar el video por un canvas
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;';
    if (heroVideo) heroVideo.replaceWith(canvas);
    else document.querySelector('.hero').prepend(canvas);
    ctx = canvas.getContext('2d');

    // Precargar todos los frames
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const num = String(i).padStart(4, '0');
      img.src = `assets/frames/frame-${num}.jpg`;
      img.onload = () => {
        framesLoaded++;
        if (framesLoaded === 1) {
          // En cuanto el primer frame carga, dimensionar canvas y mostrarlo
          canvas.width = frames[0].naturalWidth;
          canvas.height = frames[0].naturalHeight;
          ctx.drawImage(frames[0], 0, 0);
          lastFrame = 0;
        }
      };
      // Si ya estaba cacheado del browser, onload no dispara — dibujarlo igual
      if (img.complete) {
        framesLoaded++;
        if (framesLoaded === 1) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          lastFrame = 0;
        }
      }
      frames[i] = img;
    }

    let rafId = null;
    let lastFrame = -1;

    const drawFrame = (index) => {
      const i = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
      if (i === lastFrame) return;
      lastFrame = i;
      if (frames[i] && frames[i].complete) {
        ctx.drawImage(frames[i], 0, 0);
      }
    };

    const scrub = () => {
      const rect = heroScrollContainer.getBoundingClientRect();
      const scrollable = heroScrollContainer.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      const frameIndex = Math.round(progress * (TOTAL_FRAMES - 1));
      drawFrame(frameIndex);
      rafId = null;
    };

    window.addEventListener('scroll', () => {
      if (!rafId) rafId = requestAnimationFrame(scrub);
    }, { passive: true });

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

  /* ---- PROCESO steps: stagger on scroll ---- */
  const procesoSteps = document.querySelectorAll('.proceso__step');
  const procesoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const idx = Array.from(procesoSteps).indexOf(entry.target);
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, idx * 100);
        procesoObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  procesoSteps.forEach(step => {
    step.style.opacity = '0';
    step.style.transform = 'translateY(30px)';
    step.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1), background 0.4s ease';
    procesoObserver.observe(step);
  });

});
