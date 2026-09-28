/* D TOUCH BARBER STUDIO — content rendering + scroll-driven motion (GSAP ScrollTrigger + Lenis) */
(() => {
  const C = window.DTOUCH || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = root.classList.contains('rm');          // prefers-reduced-motion → static final states
  const CAP = root.classList.contains('capture');    // ?capture → no smoothing, exact scrubbing (screenshots / video)
  const MOBILE = matchMedia('(max-width: 980px)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DASH = '—';

  /* ------------------------------------------------------------------ content from config.js */
  // 3D emblem: every letter = stacked extrusion layers + chrome face + light-sweep layer
  function buildEmblem(el, layers) {
    const tilt = document.createElement('div');
    tilt.className = 'emblem-tilt';
    tilt.style.transformStyle = 'preserve-3d';
    el.parentNode.insertBefore(tilt, el);
    tilt.appendChild(el);
    el.innerHTML = [...el.dataset.emblem].map(ch => {
      if (ch === ' ') return '<span class="ch sp"></span>';
      let l = '';
      for (let i = layers; i >= 1; i--) l += `<span class="lyr${i === layers ? ' back' : i <= 2 ? ' edge' : ''}" style="--i:${i}">${ch}</span>`;
      return `<span class="ch">${l}<span class="face">${ch}</span><span class="shine">${ch}</span></span>`;
    }).join('');
  }
  $$('[data-emblem]').forEach((el, k) => buildEmblem(el, MOBILE ? 8 : k ? 11 : 15));

  // services
  const svcs = C.services || [];
  $('#svc-track').innerHTML = svcs.map((s, i) => {
    const media = s.image === 'clipper'
      ? `<div class="clip" style="background-image:url(assets/img/clipper.webp);--focus:${s.focus || '50% 50%'}"></div>`
      : `<div style="background-image:url(assets/img/studio.webp);--focus:${s.focus || '50% 50%'}"></div>`;
    return `<article class="svc">
      <div class="svc-media">${media}</div><span class="svc-num">${String(i + 1).padStart(2, '0')}</span>
      <div class="svc-body">
        <h3 class="svc-name">${esc(s.name)}</h3>
        <p class="svc-desc">${s.description ? esc(s.description) : 'Description coming soon.'}</p>
        <div class="svc-meta">
          <dl><div><dt>Duration</dt><dd>${s.duration ? esc(s.duration) : DASH}</dd></div><div><dt>Price</dt><dd>${s.price ? esc(s.price) : DASH}</dd></div></dl>
          <a class="btn" data-book href="#book" aria-label="Book ${esc(s.name)}">Book</a>
        </div>
      </div></article>`;
  }).join('');
  if (svcs.some(s => !s.price || !s.duration)) $('#svc-note').textContent = 'Service menu, times and prices to be confirmed.';

  // barbers
  $('#brb-grid').innerHTML = (C.barbers || []).map(b => `
    <article class="brb">
      <div class="brb-photo${b.photo ? '' : ' ph'}"${b.photo ? ` style="background-image:url('${esc(b.photo)}')"` : ''}></div>
      <div class="brb-info">
        <h3 class="brb-name">${b.name ? esc(b.name) : 'Barber name'}</h3>
        <p class="brb-spec">${b.specialty ? esc(b.specialty) : 'Specialty — coming soon'}</p>
        <a class="btn btn-light" data-book href="#book">${b.name ? 'Book with ' + esc(b.name.split(' ')[0]) : 'Book appointment'}</a>
      </div>
    </article>`).join('');

  // before / after
  [['.ba-before', C.beforeImage, 'Before photo'], ['.ba-after', C.afterImage, 'After photo']].forEach(([sel, img, ph]) => {
    const el = $(sel);
    if (img) el.style.backgroundImage = `url('${img}')`;
    else { el.classList.add('ph'); el.dataset.ph = ph; }
  });

  // reviews — real reviews only
  const revs = C.reviews || [];
  $('#rev-body').innerHTML = revs.length
    ? `<div class="rev-grid">${revs.map(r => `<figure class="rev"><div class="rev-stars" aria-label="${r.rating || 5} out of 5">${'★'.repeat(r.rating || 5)}</div>
        <blockquote class="rev-text">“${esc(r.text)}”</blockquote><figcaption class="rev-name">${esc(r.name)}</figcaption></figure>`).join('')}</div>`
    : `<div class="rev-empty"><p>Reviews from D Touch clients will appear here.</p>${C.googleReviewsUrl ? `<a class="btn btn-ghost" href="${esc(C.googleReviewsUrl)}" target="_blank" rel="noopener">Read reviews on Google</a>` : ''}</div>`;

  // contact / location / hours
  const tbd = t => `<p class="tbd">${t}</p>`;
  $('#info').innerHTML = `
    <section><h3>Location</h3>${C.address ? `<p>${esc(C.address)}</p>` : tbd('Address to be added')}${C.mapsUrl ? `<p style="margin-top:12px"><a href="${esc(C.mapsUrl)}" target="_blank" rel="noopener">Get directions →</a></p>` : ''}</section>
    <section><h3>Hours</h3>${(C.hours || []).length ? `<ul>${C.hours.map(([d, h]) => `<li><span>${esc(d)}</span><span>${esc(h)}</span></li>`).join('')}</ul>` : tbd('Hours to be added')}</section>
    <section><h3>Contact</h3>${[C.phone && `<p><a href="tel:${esc(C.phone.replace(/[^\d+]/g, ''))}">${esc(C.phone)}</a></p>`,
      C.email && `<p><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></p>`,
      C.instagram && `<p><a href="${esc(C.instagram)}" target="_blank" rel="noopener">Instagram →</a></p>`].filter(Boolean).join('') || tbd('Contact details to be added')}</section>`;

  $('#year').textContent = new Date().getFullYear();
  $$('.exp-words li').forEach(li => (li.dataset.w = li.textContent));

  // every BOOK button → booking platform (or the booking section)
  const booking = C.bookingUrl || '#book';
  $$('[data-book]').forEach(a => {
    a.setAttribute('href', booking);
    if (/^https?:/.test(booking)) { a.target = '_blank'; a.rel = 'noopener'; }
  });

  /* ------------------------------------------------------------------ nav, menu, mobile bar */
  const nav = $('#nav'), mbar = $('.mbar'), menu = $('#menu'), menuBtn = $('.menu-btn');
  let heroST = null;   // nav stays fully transparent while the hero sequence is pinned
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 40 && !(heroST && y < heroST.end - 2));
    mbar.classList.toggle('show', !(heroST && y < heroST.end) && y > innerHeight * 0.8 && y < document.body.scrollHeight - innerHeight * 1.6);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', open); menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    open ? lenis?.stop() : lenis?.start();
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) menuBtn.click(); });

  // magnetic buttons (desktop pointers only)
  if (FINE && !RM) $$('.magnetic').forEach(el => {
    const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .28); yTo((e.clientY - r.top - r.height / 2) * .4); });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  /* ------------------------------------------------------------------ smooth scroll */
  let lenis = null;
  if (!RM && !CAP && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { duration: 1.6 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  if (RM || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  const SCRUB = CAP ? true : 1;

  document.fonts.ready.then(() => {
    /* ================================================================ HERO: close-up → pull back → D TOUCH emerges */
    const clip = $('.clip-wrap'), emb = $('.hero .emblem-in'), tilt = $('.hero .emblem-tilt');
    const chs = $$('.ch:not(.sp)', emb), shines = $$('.shine', emb);
    const dx = el => emb.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);   // offset back to the clipper's centre

    gsap.set(clip, { xPercent: -50, yPercent: -50 });
    const hero = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.stage', start: 'top top', end: MOBILE ? '+=330%' : '+=440%', scrub: SCRUB, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });
    hero
      // 1 · extreme diagonal close-up
      .fromTo(clip, { x: () => innerWidth * (MOBILE ? .1 : .17), y: () => innerHeight * .06, rotation: -34, scale: MOBILE ? 2.2 : 2.6 },
        { x: 0, y: 0, rotation: 0, scale: 1, duration: 3, ease: 'power2.inOut' }, 0)
      .to('.scroll-hint', { opacity: 0, duration: .4 }, 0)
      .to('.intro', { opacity: 0, y: -50, filter: 'blur(6px)', duration: 1.1 }, .35)
      // 2 · upright product shot with detail call-outs
      .fromTo('.annot', { opacity: 0 }, { opacity: 1, duration: .5, stagger: .35 }, 2.7)
      .fromTo('.annot i', { scaleX: 0 }, { scaleX: 1, duration: .8, stagger: .35, ease: 'power2.out' }, 2.7)
      .to('.annot', { opacity: 0, duration: .5 }, 4.3)
      // 3 · blue light at the centre, letters push out of the clipper and spread sideways
      .to('.clipper', { opacity: .5, duration: 1.2 }, 4.4)
      .fromTo('.core-glow', { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 4.4)
      .fromTo('.emblem-flare', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 1.5, ease: 'power3.out' }, 4.8)
      .fromTo(chs, { x: dx, z: -320, scaleX: .1, scaleY: .7, opacity: 0 },
        { x: 0, z: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 2, ease: 'power3.out', stagger: { each: .07, from: 'center' } }, 5.0)
      .fromTo(emb, { rotationX: 24, z: -160 }, { rotationX: 7, z: 0, duration: 2.4, ease: 'power2.out' }, 5.0)
      .to('.emblem-flare', { opacity: 0, scaleX: 1.3, duration: .9 }, 6.7)
      // 4 · light sweep across the lettering
      .fromTo(shines, { '--sheen': '130%' }, { '--sheen': '-30%', duration: 1.5, stagger: .06, ease: 'power1.inOut' }, 6.9)
      // 5 · camera pushes toward the finished emblem, brand + CTAs
      .to('.rig', { scale: MOBILE ? 1.03 : 1.12, duration: 2.2, ease: 'power2.inOut' }, 7.6)
      .to('.clipper', { opacity: .22, duration: 1.8 }, 7.6)
      .to('.core-glow', { opacity: .55, duration: 1.8 }, 7.6)
      .to(emb, { rotationX: 4, duration: 2 }, 7.6)
      .fromTo('.hero-final>*', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, stagger: .28, ease: 'power2.out' }, 8.3)
      .to({}, { duration: 1 }, 9.8);
    heroST = hero.scrollTrigger;

    // the emblem answers the mouse a little — enough to read its depth
    if (FINE && !CAP) {
      const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.2, ease: 'power3' }), ry = gsap.quickTo(tilt, 'rotationY', { duration: 1.2, ease: 'power3' });
      addEventListener('pointermove', e => { ry((e.clientX / innerWidth - .5) * 16); rx((e.clientY / innerHeight - .5) * -9); });
    }

    /* ================================================================ 2 · MORE THAN A HAIRCUT — words + macro close-ups */
    const words = $$('.exp-words li'), frames = $$('.macro'), count = $('.exp-count b');
    const exp = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.exp-stage', start: 'top top', end: MOBILE ? '+=260%' : '+=320%', scrub: SCRUB, pin: true,
        onUpdate: s => { count.textContent = '0' + Math.min(4, 1 + Math.floor(s.progress * 4.2)); } },
    });
    exp.from('.exp-h', { opacity: 0, y: 30, duration: .5 }, 0);
    words.forEach((w, i) => {
      const at = .3 + i * 1.2;
      exp.fromTo(w, { '--fill': '0%' }, { '--fill': '100%', duration: .7, ease: 'power2.inOut' }, at)
        .fromTo(frames[i], { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: .8, ease: 'power2.out' }, at)
        .to(frames[i], { scale: 1.06, duration: 1.2 }, at + .8);
      if (i < words.length - 1) exp.to(w, { opacity: .35, duration: .4 }, at + 1.1).to(frames[i], { opacity: 0, duration: .5 }, at + 1.1);
    });
    exp.to({}, { duration: .6 });

    /* ================================================================ 3 · SERVICES — horizontal track */
    const track = $('#svc-track');
    if (!MOBILE) {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, { x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.svc-pin', start: 'top top', end: () => '+=' + (dist() + innerHeight * .4), scrub: SCRUB, pin: true, invalidateOnRefresh: true } });
      gsap.from('.svc', { y: 80, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '.services', start: 'top 70%' } });
    } else {
      $$('.svc').forEach(el => gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
    }
    gsap.from('.services .sec-head > *', { y: 40, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.services', start: 'top 75%' } });

    /* ================================================================ 4 · BARBERS */
    gsap.from('.barbers .sec-head > *', { y: 40, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.barbers', start: 'top 72%' } });
    gsap.from('.brb', { y: 90, opacity: 0, duration: 1.3, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.brb-grid', start: 'top 82%' } });

    /* ================================================================ 5 · BEFORE / AFTER, scrubbed */
    gsap.timeline({ scrollTrigger: { trigger: '.diff-stage', start: 'top top', end: '+=180%', scrub: SCRUB, pin: true } })
      .from('.diff .sec-head > *', { y: 40, opacity: 0, duration: .3, stagger: .06 }, 0)
      .fromTo('#ba', { '--cut': '97%' }, { '--cut': '3%', duration: 1, ease: 'power1.inOut' }, .25)
      .to({}, { duration: .2 });

    /* ================================================================ 6 · STUDIO — window opens into the real space */
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.std-stage', start: 'top top', end: '+=200%', scrub: SCRUB, pin: true } })
      .fromTo('.std-photo', { clipPath: 'inset(26% 32% 26% 32% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.2, ease: 'power2.inOut' }, 0)
      .fromTo('.std-photo img', { scale: 1.45 }, { scale: 1.06, duration: 2 }, 0)
      .fromTo('.std-shade', { opacity: 0 }, { opacity: 1, duration: .8 }, .6)
      .fromTo('.std-copy > *', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: .6, stagger: .2, ease: 'power2.out' }, 1.1)
      .to({}, { duration: .3 });
    $$('.crop').forEach((el, i) => gsap.fromTo(el, { y: 80 + i * 40 }, { y: -40 - i * 30, ease: 'none', scrollTrigger: { trigger: '.std-strip', start: 'top bottom', end: 'bottom top', scrub: SCRUB } }));

    /* ================================================================ 7 · WHY CLIENTS COME BACK */
    const why = $('.why-stage');
    const bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;opacity:0;pointer-events:none;background:radial-gradient(70% 60% at 50% 50%,rgba(20,60,110,.35),transparent 70%),linear-gradient(#050607,#06101c 50%,#050607)';
    why.prepend(bg);
    const lines = $$('.why-lines p');
    const wt = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: why, start: 'top top', end: MOBILE ? '+=320%' : '+=400%', scrub: SCRUB, pin: true } });
    wt.to(bg, { opacity: 1, duration: .8 }, 0).from('.why-stage > .eyebrow', { opacity: 0, y: 20, duration: .4 }, 0);
    lines.forEach((l, i) => {
      const at = .3 + i * 1.1, last = i === lines.length - 1;
      wt.fromTo(l, { opacity: 0, y: 70, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .55, ease: 'power2.out' }, at);
      if (!last) wt.to(l, { opacity: 0, y: -70, filter: 'blur(10px)', duration: .45, ease: 'power2.in' }, at + .75);
    });
    wt.fromTo('.why-cta', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .5 }, .3 + (lines.length - 1) * 1.1 + .4).to({}, { duration: .6 });

    /* ================================================================ 8–9 · REVIEWS, BOOKING — quiet reveals */
    ['.reviews', '.book'].forEach(sel => gsap.from(`${sel} .sec-head > *, ${sel} .rev-body, ${sel} > h2, ${sel} > p, ${sel} > .btn, ${sel} .info section`,
      { y: 50, opacity: 0, duration: 1.1, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: sel, start: 'top 72%' } }));

    /* ================================================================ FINAL — your style. our touch. D TOUCH. */
    const fEmb = $('.final .emblem-in'), fChs = $$('.ch:not(.sp)', fEmb), fdx = el => fEmb.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
    gsap.timeline({ scrollTrigger: { trigger: '.final', start: 'top 62%' } })
      .from('.final-lines p', { opacity: 0, y: 40, filter: 'blur(10px)', duration: 1, stagger: .45, ease: 'power3.out' })
      .fromTo(fChs, { x: fdx, z: -300, scaleX: .1, opacity: 0 }, { x: 0, z: 0, scaleX: 1, opacity: 1, duration: 1.6, ease: 'power3.out', stagger: { each: .06, from: 'center' } }, '-=.2')
      .fromTo($$('.shine', fEmb), { '--sheen': '130%' }, { '--sheen': '-30%', duration: 1.4, stagger: .05, ease: 'power1.inOut' }, '-=.5')
      .from('.final > .btn', { opacity: 0, y: 30, duration: .9, ease: 'power3.out' }, '-=1');
    gsap.fromTo('.final-clipper', { yPercent: -44 }, { yPercent: -56, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'bottom top', scrub: SCRUB } });

    ScrollTrigger.refresh();
    window.__ready = true;
  });
})();
