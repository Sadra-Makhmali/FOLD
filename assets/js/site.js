/* FOLD website — small progressive enhancements only.
   No cookies, no storage, no network requests. The site works without this file. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Store badge placeholder: while the link is still "#", do not jump to the top. */
  document.querySelectorAll('a[data-store-link]').forEach(function (link) {
    if (link.getAttribute('href') === '#') {
      link.addEventListener('click', function (event) { event.preventDefault(); });
    }
  });

  /* Gentle reveal when sections scroll into view. */
  var revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  /* Hero: fold the sheet, the lights meet, the paper becomes a crane. */
  var demo = document.querySelector('[data-fold-demo]');
  if (demo) {
    var button = demo.querySelector('[data-fold-button]');
    var label = demo.querySelector('[data-fold-label]');
    var status = demo.querySelector('[data-fold-status]');
    var stage = demo.querySelector('[data-fold-stage]');
    var timers = [];
    var busy = false;

    var setState = function (state) { demo.setAttribute('data-state', state); };
    var later = function (fn, ms) { timers.push(window.setTimeout(fn, ms)); };

    var play = function () {
      var quick = reduceMotion.matches;
      busy = true;
      button.setAttribute('aria-disabled', 'true');
      setState('folded');
      status.textContent = 'The sheet folds in half and three pairs of lights meet.';
      later(function () { setState('matched'); }, quick ? 200 : 950);
      later(function () {
        setState('origami');
        status.textContent = 'The paper becomes an origami crane.';
        label.textContent = 'Unfold and try again';
        button.removeAttribute('aria-disabled');
        busy = false;
      }, quick ? 600 : 1900);
    };

    var reset = function () {
      timers.forEach(window.clearTimeout);
      timers = [];
      setState('flat');
      label.textContent = 'Fold the sheet';
      status.textContent = 'The sheet is flat again.';
    };

    var toggle = function () {
      if (busy) { return; }
      if (demo.getAttribute('data-state') === 'flat') { play(); } else { reset(); }
    };

    button.addEventListener('click', toggle);
    if (stage) { stage.addEventListener('click', toggle); }
  }

  /* Screenshot strip: previous / next buttons. */
  var strip = document.querySelector('[data-gallery]');
  if (strip) {
    var prev = document.querySelector('[data-gallery-prev]');
    var next = document.querySelector('[data-gallery-next]');

    var step = function () {
      var first = strip.querySelector('li');
      var gap = parseFloat(window.getComputedStyle(strip).columnGap) || 16;
      return first ? first.getBoundingClientRect().width + gap : 260;
    };
    var move = function (direction) {
      strip.scrollBy({ left: direction * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      window.setTimeout(sync, 500);
    };
    var sync = function () {
      var max = strip.scrollWidth - strip.clientWidth - 2;
      if (prev) { prev.disabled = strip.scrollLeft <= 2; }
      if (next) { next.disabled = strip.scrollLeft >= max; }
    };

    if (prev) { prev.addEventListener('click', function () { move(-1); }); }
    if (next) { next.addEventListener('click', function () { move(1); }); }
    strip.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
})();
