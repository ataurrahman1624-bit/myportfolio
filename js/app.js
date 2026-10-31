/* =========================================================
   app.js — plain JavaScript (jQuery and Bootstrap JS are no longer needed)
   ========================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ───────────────── 1. Loader ─────────────────
     Old version: a purely fake progress bar that ignored real loading, could never fail safe,
     re-initialised AOS in a way that retriggered every animation on scroll-up, and left the
     page invisible forever if the AOS CDN was blocked.                                     */
  var loader = $('#loader');
  var aosStarted = false;

  function startAOS() {
    if (aosStarted) return;
    aosStarted = true;
    if (window.AOS && !reduceMotion) {
      window.AOS.init({ duration: 800, offset: 80, easing: 'ease-out-cubic', once: true });
    } else {
      // AOS missing (CDN blocked) or user prefers reduced motion → never leave content hidden
      $$('[data-aos]').forEach(function (el) { el.removeAttribute('data-aos'); });
    }
  }

  function initLoader() {
    if (!loader) { body.classList.remove('is-loading'); startAOS(); return; }

    var fill = $('.loader-bar-fill', loader);
    var pct = $('.loader-percent', loader);
    var MIN = reduceMotion ? 150 : 1500;   // shortest time the loader stays up
    var MAX = 6000;                        // fail-safe: never block the page longer than this
    var started = performance.now();
    var pageLoaded = doc.readyState === 'complete';
    var shown = 0;
    var finished = false;

    if (!pageLoaded) window.addEventListener('load', function () { pageLoaded = true; }, { once: true });

    function paint(v) {
      var n = Math.round(v);
      fill.style.width = n + '%';
      pct.textContent = n + '%';
    }

    function finish() {
      if (finished) return;
      finished = true;
      pct.classList.add('done');
      setTimeout(function () {
        body.classList.remove('is-loading');
        loader.classList.add('hide');
        setTimeout(startAOS, 250);                       // let the hero animate in as the loader fades
        setTimeout(function () { loader.style.display = 'none'; }, 750);
      }, 300);
    }

    (function tick(now) {
      var t = now - started;
      var timed = Math.min(100, (t / MIN) * 100);
      var cap = (pageLoaded || t >= MAX) ? 100 : 92;   // wait at 92% until the page has really loaded
      var target = Math.min(timed, cap);
      shown = Math.min(target, shown + 1.6);
      paint(shown);
      if (shown >= 100) { finish(); return; }
      requestAnimationFrame(tick);
    })(performance.now());
  }

  /* ───────────────── 2. Footer year ───────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ───────────────── 3. Mobile drawer ───────────────── */
  var menuBtn = $('#menuBtn');
  var closeBtn = $('#closeBtn');
  var drawer = $('#drawer');

  function setDrawer(open, moveFocus) {
    if (!drawer || !menuBtn) return;
    drawer.classList.toggle('open', open);
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.setAttribute('aria-hidden', String(!open));
    if (open) drawer.removeAttribute('inert'); else drawer.setAttribute('inert', '');
    root.classList.toggle('no-scroll', open);          // stop the page scrolling behind the drawer
    if (moveFocus) (open ? closeBtn : menuBtn).focus({ preventScroll: true });
  }

  if (menuBtn && drawer) {
    setDrawer(false, false);
    menuBtn.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open'), true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false, true); });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () {
        // internal links close the drawer; external socials open in a new tab, so close too
        setDrawer(false, false);
      });
    });

    doc.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) return;
      if (e.key === 'Escape') { setDrawer(false, true); return; }
      if (e.key === 'Tab') {                           // keep keyboard focus inside the open drawer
        var f = $$('a[href], button', drawer).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    window.matchMedia('(min-width: 992px)').addEventListener('change', function (e) {
      if (e.matches) setDrawer(false, false);          // resized to desktop with drawer open
    });
  }

  /* ───────────────── 4. Scroll effects (progress bar, header shadow, back-to-top) ───────────────── */
  var progress = $('#scroll-progress');
  var header = $('#site-header');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;
    var max = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (header) header.classList.toggle('scrolled', y > 10);
    if (toTop) toTop.classList.toggle('show', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ───────────────── 5. Active nav link while scrolling ───────────────── */
  var sections = $$('main section[id]');
  var navLinks = $$('#site-header a[href^="#"]');

  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === id;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ───────────────── 6. Cursor spotlight on cards ───────────────── */
  if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    $$('.spotlight').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ───────────────── 7. Hero typewriter ───────────────── */
  var rotator = $('#rotator');
  if (rotator && !reduceMotion && rotator.dataset.words) {
    var words = rotator.dataset.words.split('|');
    var wi = 0;
    var ci = words[0].length;
    var deleting = false;

    (function type() {
      var w = words[wi];
      rotator.textContent = w.slice(0, ci);
      var delay = deleting ? 38 : 75;

      if (!deleting && ci === w.length) { deleting = true; delay = 1700; }
      else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 350; }
      else { ci += deleting ? -1 : 1; }

      setTimeout(type, delay);
    })();
  }

  /* ───────────────── 8. Contact form (AJAX + status message) ───────────────── */
  var form = $('.contact-form');
  var statusEl = $('#formStatus');

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'form-status' + (type ? ' is-' + type : '');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action') || '';

      // Placeholder endpoint: don't send visitors to a Formspree 404 page.
      if (/your-form-id/.test(action)) {
        e.preventDefault();
        console.warn('Contact form: replace "your-form-id" in index.html with your real Formspree ID.');
        setStatus('The form is not connected yet. Please email me directly instead.', 'error');
        return;
      }
      if (!window.fetch || !window.FormData) return;   // old browser → normal form submit

      e.preventDefault();
      var btn = $('.submit-btn', form);
      var label = $('span', btn);
      var original = label.textContent;
      btn.disabled = true;
      label.textContent = 'Sending...';
      setStatus('', '');

      fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          setStatus('Thanks! Your message has been sent. I\'ll get back to you soon.', 'success');
        })
        .catch(function () {
          setStatus('Something went wrong. Please try again or email me directly.', 'error');
        })
        .then(function () {
          btn.disabled = false;
          label.textContent = original;
        });
    });
  }

  /* ───────────────── Go ───────────────── */
  initLoader();
})();
