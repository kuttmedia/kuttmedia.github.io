(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(pointer: fine)');

  const SITE = window.SITE || {};
  const PROJECTS = window.PROJECTS || [];
  const CATS = window.CATEGORIES || {};

  /* ---------- content from content.js ---------- */
  if (SITE.name) {
    $$('[data-name]').forEach(el => { el.textContent = SITE.name; });
    const page = document.body.dataset.page;
    document.title = (page ? page + ' · ' : '') + SITE.name + ' · ' + (SITE.role || 'Video Production');
  }
  if (SITE.email) {
    $$('[data-email]').forEach(el => { el.href = 'mailto:' + SITE.email; el.textContent = SITE.email; });
  }
  const socials = $('#socials');
  (SITE.socials || []).forEach(s => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url; a.textContent = s.label;
    if (/^https?:/.test(s.url)) { a.target = '_blank'; a.rel = 'noopener'; }
    li.appendChild(a); if (socials) socials.appendChild(li);
  });
  if ($('#year')) $('#year').textContent = new Date().getFullYear();

  /* ---------- split text into word spans ----------
     Elements inside a heading (like the Kutt logo word) move as one word.
     Pieces with no space between them (the logo and a following ".") share a word. */
  function split(el, seed) {
    const r = rng(seed);
    const parts = [];
    let space = false;
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { space = true; return; }
          parts.push({ text: tok, space });
          space = false;
        });
      } else if (n.nodeType === 1) {
        parts.push({ node: n, space });
        space = false;
      }
    });
    const label = parts.map((p, i) => (i && p.space ? ' ' : '') +
      (p.text !== undefined ? p.text : p.node.dataset.label || p.node.textContent)).join('');
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr'; sr.textContent = label;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    const words = [];
    parts.forEach((p, i) => {
      let inner = words[words.length - 1];
      if (!inner || p.space || i === 0) {
        if (words.length) vis.appendChild(document.createTextNode(' '));
        const o = document.createElement('span');
        o.className = 'w';
        inner = document.createElement('span');
        inner.className = 'wi';
        o.appendChild(inner);
        vis.appendChild(o);
        words.push(inner);
      }
      inner.appendChild(p.text !== undefined ? document.createTextNode(p.text) : p.node);
    });
    words.forEach((inner, i) => {
      inner.parentNode.style.setProperty('--i', i);
      inner.style.setProperty('--th', (i / words.length * 0.42 + r() * 0.04).toFixed(3));
    });
    el.classList.add('mask');
    el.append(sr, vis);
  }
  $$('[data-split]').forEach((el, i) => split(el, 1234 + i * 97));

  /* ---------- smooth scrolling ---------- */
  let lenis = null;
  let lenisRaf = null;
  function initLenis() {
    if (lenis || RM.matches || typeof window.Lenis !== 'function') return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = t => { lenis.raf(t); lenisRaf = requestAnimationFrame(raf); };
    lenisRaf = requestAnimationFrame(raf);
  }
  function destroyLenis() {
    if (!lenis) return;
    cancelAnimationFrame(lenisRaf);
    lenis.destroy();
    lenis = null;
  }
  initLenis();

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#main' || id === '#') return;
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) scrollTo(0, 0);
    else target.scrollIntoView();
    history.replaceState(null, '', id);
  });

  /* ---------- page transitions: fade out before leaving for another page ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || RM.matches) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 380);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving'); });

  /* =========================================================
     HERO: logo over a muted, looping reel (home page only)
     ========================================================= */
  const hero = $('.hero');
  const stage = $('.hero-stage');
  const video = $('#heroVideo');
  let heroOnScreen = true, reelOn = false, reelLoaded = false;

  function loadHeroReel() {
    if (reelLoaded || !SITE.heroReel) return;
    reelLoaded = true;
    video.muted = true;
    video.loop = true;
    video.preload = 'auto';
    if (SITE.heroPoster) video.poster = SITE.heroPoster;
    video.addEventListener('playing', () => stage.classList.add('reel-ready'), { once: true });
    video.addEventListener('error', () => stage.classList.remove('reel-ready'));
    video.src = SITE.heroReel;
  }
  function reelPlay(on) {
    if (!reelLoaded) return;
    if (on) video.play().catch(() => {});
    else video.pause();
  }
  if (hero) {
    new IntersectionObserver(([e]) => {
      heroOnScreen = e.isIntersecting;
      reelPlay(heroOnScreen && reelOn);
    }).observe(hero);
  }

  /* phones, small screens and reduced motion get a still frame instead of the reel (identical to the CSS) */
  const GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  const MQLS = GATES.map(q => matchMedia(q));
  function setStaticPoster() {
    if (SITE.heroPoster) {
      stage.style.backgroundImage = 'linear-gradient(rgba(18,14,26,.45),rgba(18,14,26,.8)),url("' + SITE.heroPoster + '")';
      stage.style.backgroundSize = 'cover';
      stage.style.backgroundPosition = 'center';
    }
  }
  function applyHeroMode() {
    if (!hero) return;
    reelOn = !MQLS.some(m => m.matches);
    if (reelOn) {
      stage.style.backgroundImage = '';
      loadHeroReel();
      reelPlay(heroOnScreen);
    } else {
      reelPlay(false);
      setStaticPoster();
    }
  }
  MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
  applyHeroMode();

  /* =========================================================
     Scroll-driven page: nav, timecode, fill text, drawn lines
     ========================================================= */
  const nav = $('#nav');
  const contact = $('#contact');
  const tcEls = $$('.tc');
  let navDark = null, navScrolled = null, navFooter = null, lastTc = '', lastTcAt = 0;

  function timecode(y) {
    const f = Math.max(0, Math.floor(y / 3));
    const fr = f % 25, s = Math.floor(f / 25) % 60, m = Math.floor(f / 1500) % 60, h = Math.floor(f / 90000);
    const pad = n => String(n).padStart(2, '0');
    return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(fr);
  }

  // fill text: wrap each word
  const fill = $('[data-fill]');
  const fillWords = [];
  if (fill) (function wrapWords(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'fw'; s.textContent = part;
          fillWords.push(s); frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  })(fill);
  let litCount = -1;

  const drawPaths = $$('[data-draw]').map(path => ({ path, box: path.ownerSVGElement, last: -1 }));
  const drawBoxes = drawPaths.map(d => d.box.closest('.svc-list-wrap') || d.box);

  // photos that drift slowly inside their frame as the page scrolls
  const parallax = $$('[data-parallax]').map(el => ({ el, box: el.parentElement, last: '' }));

  let lastY = scrollY, vel = 0, dir = 1;
  let pinned = false;

  function onFrame() {
    scheduled = false;
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    if (dy) { dir = dy > 0 ? 1 : -1; vel = clamp(vel + Math.abs(dy) * 0.06, 0, 9); }

    // content moved under a still mouse: refresh the cursor label
    if (cOn && gx !== -999) {
      const under = document.elementFromPoint(mxT, myT);
      onOver({ target: under || document.body });
    }

    // nav
    const inFooter = !!contact && contact.getBoundingClientRect().top < 64;
    const dark = (hero && hero.getBoundingClientRect().bottom > 64) || inFooter || document.body.dataset.nav === 'dark';
    if (inFooter !== navFooter) { nav.classList.toggle('in-footer', inFooter); navFooter = inFooter; }
    const scrolled = y > 10;
    if (dark !== navDark) { nav.classList.toggle('on-dark', dark); navDark = dark; }
    if (scrolled !== navScrolled) { nav.classList.toggle('scrolled', scrolled); navScrolled = scrolled; }

    // timecode, ~10Hz and only on change
    const now = performance.now();
    if (now - lastTcAt > 100) {
      const tc = timecode(y);
      if (tc !== lastTc) { tcEls.forEach(el => { el.textContent = tc; }); lastTc = tc; lastTcAt = now; }
    }

    if (pinned) return;

    // fill text
    if (fill) {
      const fr = fill.getBoundingClientRect();
      const fp = clamp((innerHeight * 0.85 - fr.top) / (fr.height + innerHeight * 0.35), 0, 1);
      const n = Math.round(fp * fillWords.length);
      if (n !== litCount) {
        const lo = Math.min(n, Math.max(litCount, 0)), hi = Math.max(n, litCount);
        for (let i = lo; i < hi && i < fillWords.length; i++) fillWords[i].classList.toggle('lit', i < n);
        litCount = n;
      }
    }

    // parallax photos
    parallax.forEach(px => {
      const r = px.box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      const tf = 'translate3d(0,' + ((0.5 - p) * 10).toFixed(2) + '%,0) scale(1.14)';
      if (tf !== px.last) { px.el.style.transform = tf; px.last = tf; }
    });

    // self-drawing lines
    drawPaths.forEach((d, i) => {
      const r = drawBoxes[i].getBoundingClientRect();
      const p = clamp((innerHeight * 0.9 - r.top) / (r.height + innerHeight * 0.3), 0, 1);
      const off = Math.round((1 - p) * 1000) / 1000;
      if (off !== d.last) { d.path.style.strokeDashoffset = off; d.last = off; }
    });
  }
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(onFrame);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  schedule();

  /* ---------- entrances ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      setTimeout(() => el.classList.add('done'), 1800);
      revealIO.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  /* ---------- marquee: drifts, speeds up with scroll ---------- */
  const track = $('.marquee-track');
  let mx = 0, mRaf = null, mLast = 0, mHalf = 0;
  if (track) {
    const unit = [...track.children];
    while (track.scrollWidth < 2600) unit.forEach(n => track.appendChild(n.cloneNode(true)));
    [...track.children].forEach(n => track.appendChild(n.cloneNode(true)));
    mHalf = track.scrollWidth / 2;
    addEventListener('resize', () => { mHalf = track.scrollWidth / 2; });
  }
  function marqueeLoop(now) {
    const dt = Math.min(100, now - (mLast || now));
    mLast = now;
    mx -= (0.55 + vel) * dir * (dt / 16.667);
    vel *= Math.pow(0.9, dt / 16.667);
    if (mx <= -mHalf) mx += mHalf;
    if (mx > 0) mx -= mHalf;
    track.style.transform = 'translate3d(' + mx.toFixed(1) + 'px,0,0)';
    mRaf = requestAnimationFrame(marqueeLoop);
  }
  if (track) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !RM.matches) { if (mRaf === null) { mLast = 0; mRaf = requestAnimationFrame(marqueeLoop); } }
      else if (mRaf !== null) { cancelAnimationFrame(mRaf); mRaf = null; }
    }).observe($('.marquee'));
  }

  /* =========================================================
     Cursor: soft glow + ring that becomes a label
     ========================================================= */
  const cursor = $('.cursor');
  const glow = $('.c-glow');
  const ring = $('.c-ring');
  const label = $('.c-label');
  let cOn = false, mxT = -999, myT = -999, gx = -999, gy = -999, rx = -999, ry = -999, cRaf = null, cLast = 0;
  function cursorLoop(now) {
    const dt = Math.min(100, now - (cLast || now));
    cLast = now;
    const n = dt / 16.667;
    gx += (mxT - gx) * (1 - Math.pow(1 - 0.08, n));
    gy += (myT - gy) * (1 - Math.pow(1 - 0.08, n));
    rx += (mxT - rx) * (1 - Math.pow(1 - 0.24, n));
    ry += (myT - ry) * (1 - Math.pow(1 - 0.24, n));
    glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
    ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    if (Math.abs(mxT - gx) + Math.abs(myT - gy) < 0.3) { cRaf = null; cLast = 0; }
    else cRaf = requestAnimationFrame(cursorLoop);
  }
  function onMove(e) {
    mxT = e.clientX; myT = e.clientY;
    if (gx === -999) { gx = rx = mxT; gy = ry = myT; }
    cursor.classList.remove('is-hidden');
    if (cRaf === null) cRaf = requestAnimationFrame(cursorLoop);
  }
  function onOver(e) {
    const t = e.target.closest('[data-cursor]');
    if (t) { label.textContent = t.dataset.cursor; cursor.classList.add('is-label'); }
    else cursor.classList.remove('is-label');
  }
  const onLeave = () => cursor.classList.add('is-hidden');
  function cursorOn() {
    if (cOn || !FINE.matches || RM.matches) return;
    cOn = true;
    document.body.classList.add('has-cursor');
    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver);
    document.documentElement.addEventListener('pointerleave', onLeave);
  }
  function cursorOff() {
    if (!cOn) return;
    cOn = false;
    document.body.classList.remove('has-cursor');
    removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    if (cRaf !== null) { cancelAnimationFrame(cRaf); cRaf = null; }
  }
  FINE.addEventListener('change', () => (FINE.matches && !RM.matches ? cursorOn() : cursorOff()));
  cursorOn();

  /* =========================================================
     Work grid
     ========================================================= */
  const grid = $('#grid');
  const filters = $('.filters');
  const PLAY_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="rgba(244,241,250,.55)" stroke-width="1.5"/><path d="M26 21 L45 32 L26 43Z" fill="rgba(244,241,250,.85)"/></svg>';
  const tr = rng(42);
  const tiles = (grid ? PROJECTS : []).map((p, i) => {
    // a project with its own page links there; otherwise the tile opens the player
    const t = document.createElement(p.page ? 'a' : 'button');
    if (p.page) t.href = p.page;
    else t.type = 'button';
    t.className = 'tile pre';
    t.dataset.cat = p.category;
    t.dataset.cursor = p.page ? 'View' : 'Play';
    t.setAttribute('aria-label', (p.page ? '' : 'Play ') + p.title + ', ' + (CATS[p.category] || p.category));
    const media = document.createElement('div');
    media.className = 'tile-media';
    if (p.poster) {
      const img = document.createElement('img');
      img.src = p.poster; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      media.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'ph';
      ph.style.setProperty('--px', Math.round(15 + tr() * 70) + '%');
      ph.style.setProperty('--py', Math.round(10 + tr() * 60) + '%');
      ph.innerHTML = PLAY_SVG;
      media.appendChild(ph);
    }
    if (p.duration) {
      const d = document.createElement('span');
      d.className = 'tile-dur mono'; d.textContent = p.duration;
      media.appendChild(d);
    }
    const meta = document.createElement('div');
    meta.className = 'tile-meta';
    meta.innerHTML = '<div class="tile-row"><span class="mono tile-cat"></span><span class="mono tile-client"></span></div><h3></h3>';
    meta.querySelector('.tile-cat').textContent = CATS[p.category] || p.category;
    meta.querySelector('h3').textContent = p.title;
    meta.querySelector('.tile-client').textContent = [p.client, p.year].filter(Boolean).join(' · ');
    t.append(media, meta);

    if (p.preview) {
      let v = null;
      t.addEventListener('pointerenter', () => {
        if (!FINE.matches || RM.matches) return;
        if (!v) {
          v = document.createElement('video');
          v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
          v.setAttribute('aria-hidden', 'true');
          v.src = p.preview;
          media.insertBefore(v, media.firstChild.nextSibling);
        }
        v.play().then(() => t.classList.add('playing')).catch(() => {});
      });
      t.addEventListener('pointerleave', () => { if (v) { v.pause(); t.classList.remove('playing'); } });
    }
    if (!p.page) t.addEventListener('click', () => openPlayer(p));
    grid.appendChild(t);
    return t;
  });

  const tileIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const t = e.target;
      t.style.transitionDelay = (tiles.indexOf(t) % 3) * 110 + 'ms';
      t.classList.remove('pre');
      setTimeout(() => { t.style.transitionDelay = ''; }, 1200);
      tileIO.unobserve(t);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  tiles.forEach(t => tileIO.observe(t));

  // filters, once there's enough work to be worth filtering
  if (filters && PROJECTS.length < 4) filters.hidden = true;
  const usedCats = filters && !filters.hidden ? [...new Set(PROJECTS.map(p => p.category))] : [];
  usedCats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip-btn'; b.type = 'button';
    b.dataset.filter = c; b.setAttribute('aria-pressed', 'false');
    b.textContent = CATS[c] || c;
    filters.appendChild(b);
  });
  let filterTimer = null;
  if (filters) filters.addEventListener('click', e => {
    const b = e.target.closest('.chip-btn');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    $$('.chip-btn', filters).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const cat = b.dataset.filter;
    const match = t => cat === 'all' || t.dataset.cat === cat;
    clearTimeout(filterTimer);
    if (RM.matches) { tiles.forEach(t => { t.hidden = !match(t); }); return; }
    tiles.forEach(t => t.classList.add('is-out'));
    filterTimer = setTimeout(() => {
      tiles.forEach(t => { t.hidden = !match(t); t.classList.remove('pre'); });
      const vis = tiles.filter(t => !t.hidden);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        vis.forEach((t, i) => { t.style.transitionDelay = i * 70 + 'ms'; t.classList.remove('is-out'); });
        setTimeout(() => vis.forEach(t => { t.style.transitionDelay = ''; }), 900 + vis.length * 70);
      }));
    }, 380);
  });

  /* ---------- player ---------- */
  const player = $('#player');
  const frame = $('#player-frame');
  function openPlayer(p) {
    $('#player-title').textContent = p.title;
    $('#player-meta').textContent = [CATS[p.category] || p.category, p.client, p.year].filter(Boolean).join(' · ');
    frame.innerHTML = '';
    if (p.youtube) {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(p.youtube) + '?autoplay=1&rel=0&modestbranding=1';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true; f.title = p.title;
      frame.appendChild(f);
    } else if (p.vimeo) {
      const f = document.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + encodeURIComponent(p.vimeo) + '?autoplay=1&dnt=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true; f.title = p.title;
      frame.appendChild(f);
    } else if (p.file) {
      const v = document.createElement('video');
      v.src = p.file; v.controls = true; v.autoplay = true; v.playsInline = true;
      if (p.poster) v.poster = p.poster;
      frame.appendChild(v);
    } else {
      frame.innerHTML = '<div class="player-empty"><p class="mono">This cut is in the edit. Check back soon.</p></div>';
    }
    if (lenis) lenis.stop();
    player.showModal();
  }
  if (player) {
    player.addEventListener('close', () => { frame.innerHTML = ''; if (lenis) lenis.start(); });
    player.addEventListener('click', e => { if (e.target === player) player.close(); });
    $('.player-close').addEventListener('click', () => player.close());
  }

  /* ---------- project page video: a still with a play button, swapped for YouTube on click ---------- */
  $$('[data-yt]').forEach(box => {
    box.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.dataset.yt) + '?autoplay=1&rel=0&modestbranding=1';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true; f.title = box.getAttribute('aria-label') || 'Video';
      box.replaceWith(f);
    }, { once: true });
  });

  /* ---------- copy email ---------- */
  const copyBtn = $('.copy-btn');
  let copyTimer = null;
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SITE.email || $('[data-email]').textContent);
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('copied');
    } catch (_) {
      copyBtn.textContent = 'Press Ctrl+C';
    }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyBtn.textContent = 'Copy email'; copyBtn.classList.remove('copied'); }, 2200);
  });

  /* =========================================================
     Reduced motion, honoured live in both directions
     ========================================================= */
  function pinToFinalStates() {
    pinned = true;
    document.body.classList.add('rm-pinned');
    $$('[data-reveal]').forEach(el => el.classList.add('in', 'done'));
    tiles.forEach(t => t.classList.remove('pre', 'is-out'));
    fillWords.forEach(w => w.classList.add('lit'));
    litCount = fillWords.length;
    drawPaths.forEach(d => { d.path.style.strokeDashoffset = 0; d.last = 0; });
    if (mRaf !== null) { cancelAnimationFrame(mRaf); mRaf = null; }
    if (track) track.style.transform = '';
    parallax.forEach(px => { px.el.style.transform = ''; px.last = ''; });
    cursorOff();
    destroyLenis();
  }
  function unpinFinalStates() {
    pinned = false;
    document.body.classList.remove('rm-pinned');
    litCount = -1;
    drawPaths.forEach(d => { d.last = -1; });
    initLenis();
    cursorOn();
    schedule();
  }
  RM.addEventListener('change', e => {
    if (e.matches) pinToFinalStates();
    else { unpinFinalStates(); applyHeroMode(); }
  });
  if (RM.matches) pinToFinalStates();

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('paused', document.hidden);
  });
})();
