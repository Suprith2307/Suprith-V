(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* footer year */
  $('#yr').textContent = new Date().getFullYear();

  /* mobile menu */
  var menu = $('#menu'), links = $('#links');
  function setMenu(open) {
    links.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menu.addEventListener('click', function () { setMenu(menu.getAttribute('aria-expanded') !== 'true'); });
  $$('a', links).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* scroll reveal */
  var items = $$('.rv, .wipe');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* active section in the navigation */
  var navLinks = $$('#links a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  /* scroll state: navbar background, progress bar, timeline line, active link */
  var nav = $('#nav'), bar = $('.bar'), lines = $$('ol.time'), ticking = false;
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    nav.classList.toggle('scrolled', window.scrollY > 12);
    lines.forEach(function (ol) {
      var r = ol.getBoundingClientRect();
      ol.style.setProperty('--p', Math.max(0, Math.min(1, (window.innerHeight * 0.65 - r.top) / r.height)));
    });
    var cur = 0, y = window.innerHeight * 0.35;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= y) cur = i; });
    navLinks.forEach(function (a, i) {
      a.classList.toggle('on', i === cur);
      if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* typing effect */
  var roles = ['Aspiring Developer', 'Engineering Student', 'Web Development Enthusiast', 'Technology Explorer'];
  var out = $('#type');
  if (!reduced) {
    var ri = 0, ci = roles[0].length, del = true;
    (function tick() {
      var word = roles[ri], wait = del ? 38 : 85;
      if (!del) { ci++; out.textContent = word.slice(0, ci); if (ci === word.length) { del = true; wait = 1600; } }
      else { ci--; out.textContent = word.slice(0, Math.max(ci, 0)); if (ci <= 0) { del = false; ri = (ri + 1) % roles.length; ci = 0; wait = 350; } }
      setTimeout(tick, wait);
    })();
  }

  /* welding cells slider: drag, arrows, progress */
  var track = $('.track'), prog = $('.prog i'), moved = 0;
  function step(dir) {
    track.scrollBy({ left: dir * ($('.cell').offsetWidth + 18), behavior: reduced ? 'auto' : 'smooth' });
  }
  $('#prev').addEventListener('click', function () { step(-1); });
  $('#next').addEventListener('click', function () { step(1); });
  function updateProg() {
    var max = track.scrollWidth - track.clientWidth, vis = track.clientWidth / track.scrollWidth;
    prog.style.transform = 'scaleX(' + (vis + (max > 0 ? (track.scrollLeft / max) * (1 - vis) : 0)) + ')';
  }
  track.addEventListener('scroll', updateProg, { passive: true });
  updateProg();
  var down = false, sx = 0, sl = 0;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft; track.classList.add('drag');
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    moved = Math.abs(e.clientX - sx); track.scrollLeft = sl - (e.clientX - sx);
  });
  window.addEventListener('pointerup', function () { down = false; track.classList.remove('drag'); });
  track.addEventListener('click', function (e) { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);

  /* lightbox */
  var dlg = $('#d'), big = $('#di');
  $$('.fig').forEach(function (img) {
    img.addEventListener('click', function () {
      if (!dlg.showModal) return;
      big.src = img.src; big.alt = img.alt; dlg.showModal();
    });
  });
  dlg.addEventListener('click', function () { dlg.close(); });

  /* copy email */
  var copyBtn = $('#copy'), note = $('#copied'), timer;
  function done(ok) {
    note.textContent = ok ? 'Email address copied to clipboard.' : 'Could not copy. Please select the address above and copy it.';
    copyBtn.textContent = ok ? 'Copied' : 'Copy email';
    clearTimeout(timer);
    timer = setTimeout(function () { note.textContent = ''; copyBtn.textContent = 'Copy email'; }, 2600);
  }
  copyBtn.addEventListener('click', function () {
    var text = $('#mailtxt').textContent.trim();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(t); done(ok);
    }
  });

  /* subtle cursor follower: desktop only, normal pointer stays visible */
  if (fine && !reduced) {
    var ring = $('.cur'), mx = 0, my = 0, rx = 0, ry = 0, started = false;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!started) { started = true; rx = mx; ry = my; ring.classList.add('on'); loop(); }
      var hot = e.target.closest && e.target.closest('a, button, .fig, .track');
      ring.classList.toggle('hot', !!hot);
    });
    document.addEventListener('mouseleave', function () { ring.classList.remove('on'); });
    document.addEventListener('mouseenter', function () { if (started) ring.classList.add('on'); });
    function loop() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    }
  }
})();
