/* Hyule Wines — site script.
   Loads content.json, fills the page, runs the animations.
   Texts, photos and colors are edited in /admin/, not here. */
(function () {
  'use strict';

  var PREVIEW = /[?&]preview=1/.test(location.search);   // opened inside the admin panel
  var root = document.documentElement;
  if (PREVIEW) root.classList.add('preview');

  var HEX = /^#[0-9a-f]{6}$/i;
  var touch = matchMedia('(hover:none)').matches;
  var canHover = matchMedia('(hover:hover)').matches;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function get(o, p) {
    var a = p.split('.');
    for (var i = 0; i < a.length; i++) { if (o == null) return undefined; o = o[a[i]]; }
    return o;
  }
  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  /* ---------- Reveal on scroll + counters ---------- */
  function count(el) {
    var end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null, dur = 1800;
    (function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + (p === 1 ? suf : '');
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      $$('[data-count]', en.target).forEach(count);
      io.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  function watch() {
    $$('.reveal').forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
  }

  /* ---------- Card tilt ---------- */
  function tilt(c) {
    if (!canHover || c._tilt) return;
    c._tilt = true;
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = 'perspective(900px) rotateY(' + ((x - .5) * 10) + 'deg) rotateX(' + ((.5 - y) * 10) + 'deg) translateY(-6px)';
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    });
    c.addEventListener('mouseleave', function () { c.style.transform = ''; });
  }

  /* ---------- Rendering from content.json ---------- */
  var THEME = {
    bg: ['--bg', '--bg-rgb'], bg2: ['--bg2'], wine: ['--wine', '--wine-rgb'],
    wineLight: ['--wine-light', '--wine-light-rgb'], accent: ['--gold', '--gold-rgb'],
    accentSoft: ['--gold-soft', '--soft-rgb'], text: ['--cream'], muted: ['--muted']
  };
  function applyTheme(t) {
    if (!t) return;
    Object.keys(THEME).forEach(function (k) {
      if (!HEX.test(t[k])) return;
      root.style.setProperty(THEME[k][0], t[k]);
      if (THEME[k][1]) root.style.setProperty(THEME[k][1], rgb(t[k]));
    });
    if (HEX.test(t.bg)) $('#metaTheme').setAttribute('content', t.bg);
  }

  function applyText(c) {
    $$('[data-k]').forEach(function (e) {
      var v = get(c, e.getAttribute('data-k'));
      if (typeof v === 'string') e.textContent = v;
    });
    if (touch) { var h = $('#hint'); h.textContent = h.textContent.replace(/^click/i, 'Tap'); }
  }

  function applyLinks(c) {
    var ct = c.contacts || {};
    if (typeof ct.phone === 'string') $('#phoneLink').setAttribute('href', 'tel:' + ct.phone.replace(/[^\d+]/g, ''));
    if (typeof ct.email === 'string') {
      var m = 'mailto:' + ct.email.trim();
      $('#emailLink').setAttribute('href', m);
      $('#ctaBtn').setAttribute('href', m + '?subject=Tasting');
    }
  }

  function applySeo(c) {
    var s = c.seo || {};
    if (s.title) { document.title = s.title; $('#ogTitle').setAttribute('content', s.title); }
    if (s.description) { $('#metaDesc').setAttribute('content', s.description); $('#ogDesc').setAttribute('content', s.description); }
  }

  function applyImages(c) {
    var bg = $('#heroBg'), hi = get(c, 'hero.image');
    if (hi) { bg.style.backgroundImage = 'url("' + String(hi).replace(/["\\]/g, '') + '")'; bg.classList.add('on'); }
    else { bg.style.backgroundImage = ''; bg.classList.remove('on'); }
    var art = $('#storyArt'), si = get(c, 'story.image'), ph = $('#storyPhoto');
    if (si) { ph.src = si; art.classList.add('has-photo'); }
    else { ph.removeAttribute('src'); art.classList.remove('has-photo'); }
  }

  function bottleSVG(color) {
    var d = 'M24 4h12v34c0 10 14 20 14 44v96a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V82c0-24 14-34 14-44Z';
    return '<svg class="bottle" viewBox="0 0 60 190" aria-hidden="true">' +
      '<path d="' + d + '" style="fill:' + color + '"/>' +
      '<path d="' + d + '" style="fill:none;stroke:var(--gold)" stroke-width="1"/>' +
      '<rect x="10" y="100" width="40" height="52" style="fill:var(--cream)"/>' +
      '<circle cx="30" cy="120" r="6" style="fill:none;stroke:var(--wine)" stroke-width="1.4"/>' +
      '<rect x="17" y="136" width="26" height="2" style="fill:var(--wine)"/>' +
      '<rect x="22" y="2" width="16" height="12" style="fill:var(--wine)"/></svg>';
  }

  function renderWine(items) {
    var box = $('#wineCards');
    if (!box || !Array.isArray(items)) return;
    box.textContent = '';
    items.forEach(function (it, i) {
      var a = mk('article', 'card reveal');
      a.style.setProperty('--d', (i % 3) * .15 + 's');
      if (it.image) {
        var im = new Image(); im.className = 'wine-photo'; im.alt = it.name || ''; im.src = it.image;
        a.appendChild(im);
      } else {
        var w = document.createElement('div');
        w.innerHTML = bottleSVG(HEX.test(it.bottle) ? it.bottle : '#0c3454');
        a.appendChild(w.firstChild);
      }
      a.appendChild(mk('span', 'type', it.type || ''));
      a.appendChild(mk('h3', '', it.name || ''));
      a.appendChild(mk('p', '', it.desc || ''));
      var notes = mk('div', 'notes');
      String(it.notes || '').split(',').forEach(function (n) { n = n.trim(); if (n) notes.appendChild(mk('span', '', n)); });
      a.appendChild(notes);
      var pr = mk('div', 'price');
      pr.appendChild(document.createTextNode((it.price || '') + ' '));
      if (it.unit) pr.appendChild(mk('small', '', it.unit));
      a.appendChild(pr);
      tilt(a);
      box.appendChild(a);
    });
  }

  function renderStats(list) {
    var box = $('#stats');
    if (!box || !Array.isArray(list)) return;
    box.textContent = '';
    list.forEach(function (s) {
      var d = mk('div', 'stat'), b = mk('b');
      var m = String(s.n == null ? '' : s.n).match(/^(\d+)(\D*)$/);
      if (m && !PREVIEW && !reduce) { b.dataset.count = m[1]; b.dataset.suffix = m[2]; b.textContent = '0'; }
      else b.textContent = s.n == null ? '' : s.n;
      d.appendChild(b); d.appendChild(mk('span', '', s.label || ''));
      box.appendChild(d);
    });
  }

  function renderTimeline(list) {
    var box = $('#timeline');
    if (!box || !Array.isArray(list)) return;
    box.textContent = '';
    list.forEach(function (t) {
      var row = mk('div', 'tl reveal'), x = mk('div', 'txt');
      row.appendChild(mk('div', 'year', t.year || ''));
      x.appendChild(mk('h3', '', t.title || '')); x.appendChild(mk('p', '', t.text || ''));
      row.appendChild(x); box.appendChild(row);
    });
  }

  function render(c) {
    applyTheme(c.theme);
    applyText(c);
    applyLinks(c);
    applySeo(c);
    applyImages(c);
    renderWine(get(c, 'wine.items'));
    renderStats(get(c, 'story.stats'));
    renderTimeline(get(c, 'story.timeline'));
    if (PREVIEW) $$('.reveal').forEach(function (e) { e.classList.add('in'); });
    else watch();
  }

  /* ---------- Hero title, nav, glass rings ---------- */
  function splitTitle() {
    var title = $('#title'), delay = .35, i = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            if (c === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            var s = mk('span', 'ch', c);
            s.style.animationDelay = (delay + i++ * .045) + 's';
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') split(n);
      });
    })(title);
  }

  function initNav() {
    var nav = $('#nav'), bar = $('#progress');
    var links = $$('.links a');
    var sections = links.map(function (a) { return $(a.getAttribute('href')); });
    function onScroll() {
      var y = window.scrollY, h = root.scrollHeight - innerHeight;
      nav.classList.toggle('scrolled', y > 40);
      bar.style.width = (h > 0 ? y / h * 100 : 0) + '%';
      var cur = 0;
      sections.forEach(function (s, k) { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = k; });
      links.forEach(function (a, k) { a.classList.toggle('active', k === cur && y > 80); });
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initRings() {
    var hero = $('#top'), layer = $('#rings'), hint = $('#hint');
    var MAX = 14, hintHidden = false;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      var box = hero.getBoundingClientRect(), s = Math.round(rnd(86, 112));
      var m = mk('div', 'mark');
      m.style.setProperty('--x', (e.clientX - box.left) + 'px');
      m.style.setProperty('--y', (e.clientY - box.top) + 'px');
      m.style.setProperty('--s', s + 'px');
      m.style.setProperty('--r', rnd(0, 360) + 'deg');

      var stain = mk('span', 'stain'), br = [];
      for (var i = 0; i < 8; i++) br.push(rnd(46, 54) + '%');
      stain.style.borderRadius = br.slice(0, 4).join(' ') + ' / ' + br.slice(4).join(' ');
      m.appendChild(stain); m.appendChild(mk('span', 'ripple')); m.appendChild(mk('span', 'cup'));

      for (var k = 0, n = Math.floor(rnd(2, 5)); k < n; k++) {
        var d = rnd(3, 6), ang = rnd(0, Math.PI * 2), R = s / 2 + rnd(6, 16);
        var drip = mk('span', 'drip');
        drip.style.setProperty('--d', d + 'px');
        drip.style.setProperty('--dx', (s / 2 + Math.cos(ang) * R - d / 2) + 'px');
        drip.style.setProperty('--dy', (s / 2 + Math.sin(ang) * R - d / 2) + 'px');
        m.appendChild(drip);
      }
      layer.appendChild(m);
      while (layer.children.length > MAX) layer.removeChild(layer.firstChild);
      setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 23000);
      if (!hintHidden) { hintHidden = true; hint.style.animation = 'hintOut .6s forwards'; }
    });
  }

  /* ---------- Start ---------- */
  function start() {
    $('#year').textContent = new Date().getFullYear();
    if (!PREVIEW) { splitTitle(); watch(); }
    $$('.card').forEach(tilt);
    initNav();
    initRings();
    root.classList.remove('loading');
  }

  if (PREVIEW) {
    // Inside the admin panel: wait for content sent by the editor
    addEventListener('message', function (e) {
      if (e.origin !== location.origin || e.source !== parent || !e.data) return;
      if (e.data.type === 'preview' && e.data.content) render(e.data.content);
      if (e.data.type === 'preview-scroll') {
        var t = document.getElementById(e.data.id);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    start();
    $$('.reveal').forEach(function (e) { e.classList.add('in'); });
    parent.postMessage({ type: 'preview-ready' }, location.origin);
  } else {
    var done = false;
    var go = function (c) { if (done) return; done = true; if (c) render(c); start(); };
    fetch('content.json?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(go, function () { go(null); });      // fallback: texts already in the HTML
  }
})();
