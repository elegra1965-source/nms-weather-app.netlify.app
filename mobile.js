/* Atlas Weather Station — phone helpers (2026-10-09): jump bar, fold toggles, swipeable
   readings with dots, survey scan on tap, back-to-top. All hidden on desktop by mobile.css. */
(function () {
  var MQ = window.matchMedia('(max-width:700px)');
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var beh = reduce ? 'auto' : 'smooth';
  function $(s, r) { return (r || document).querySelector(s); }
  function tog(label, box, after, onOpen) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'm-tog'; b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span>' + label + '</span><span class="chev" aria-hidden="true">▾</span>';
    b.addEventListener('click', function () { set(!box.classList.contains('m-open')); });
    function set(open) {
      box.classList.toggle('m-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && onOpen) onOpen();
    }
    after.parentNode.insertBefore(b, after.nextSibling);
    return set;
  }

  function folds() {
    var hero = $('#hero'), cond = $('#hero .cond');
    if (hero && cond) tog('◈ BIOME MATCH & EXOSUIT REPORT', hero, cond);

    var week = $('.panel.week'), days = $('#days');
    if (week && days) { week.id = 'm-week'; tog('ALL 7 DAYS', week, days); }

    var haz = $('.panel.haz'), head = haz && haz.children[2];
    if (haz && head) {
      haz.id = 'm-haz';
      var setHaz = tog('EXOSUIT READINGS', haz, head), user = false, p = $('#protect');
      haz.querySelector('.m-tog').addEventListener('click', function () { user = true; });
      var auto = function () { if (!user) setHaz(+(p && p.textContent) < 100); };
      if (p && 'MutationObserver' in window) new MutationObserver(auto).observe(p, { childList: true, characterData: true, subtree: true });
      auto();
    }

    var rp = $('#radarPanel'), rh = rp && $('.rd-head', rp);
    if (rp && rh) tog('▸ SHOW RAIN RADAR', rp, rh, function () { window.dispatchEvent(new Event('resize')); });

    var sv = $('.survey'), cards = $('#cards');
    if (sv && cards) {
      sv.id = 'm-survey';
      var hint = document.createElement('div'); hint.className = 'sv-hint'; hint.textContent = '▸ TAP A WORLD FOR ITS FULL SCAN & PORTAL ADDRESS';
      cards.parentNode.insertBefore(hint, cards.nextSibling);
      cards.addEventListener('click', function (e) {
        if (!MQ.matches || !e.target.closest('.wcard')) return;
        sv.classList.add('m-open');
        var sc = $('#scan'); if (sc) setTimeout(function () { sc.scrollIntoView({ behavior: beh, block: 'start' }); }, 60);
      });
    }
  }

  function tileDots() {
    var grid = $('#tiles'); if (!grid) return;
    var dots = document.createElement('div'); dots.className = 'tile-dots';
    var hint = document.createElement('span'); hint.className = 'tile-swipe'; hint.textContent = '‹ SWIPE FOR ALL READINGS ›';
    grid.parentNode.insertBefore(dots, grid.nextSibling);
    dots.parentNode.insertBefore(hint, dots.nextSibling);
    var t;
    function mark() {
      var mid = grid.scrollLeft + grid.clientWidth / 2, best = 0, bd = 1e9;
      [].forEach.call(grid.children, function (c, i) { var d = Math.abs(c.offsetLeft - grid.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      [].forEach.call(dots.children, function (b, i) { b.classList.toggle('on', i === best); });
      if (best > 0) hint.style.visibility = 'hidden';
    }
    function build() {
      var n = grid.children.length; if (dots.children.length === n) return mark();
      dots.innerHTML = '';
      [].forEach.call(grid.children, function (c, i) {
        var b = document.createElement('button'); b.type = 'button';
        var nm = c.querySelector('.n'); b.setAttribute('aria-label', 'Show ' + (nm ? nm.textContent : 'reading ' + (i + 1)));
        b.addEventListener('click', function () { var k = grid.children[i]; if (k) grid.scrollTo({ left: k.offsetLeft - grid.offsetLeft - (grid.clientWidth - k.offsetWidth) / 2, behavior: beh }); });
        dots.appendChild(b);
      });
      mark();
    }
    if ('MutationObserver' in window) new MutationObserver(build).observe(grid, { childList: true });
    grid.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(mark, 60); }, { passive: true });
    build();
  }

  function jumpbar() {
    var hero = $('#hero'); if (!hero) return;
    var items = [['hero', 'NOW'], ['m-week', 'WEEK'], ['m-haz', 'HAZARDS'], ['radarPanel', 'RADAR'], ['m-survey', 'WORLDS']];
    var bar = document.createElement('nav'); bar.className = 'jumpbar'; bar.setAttribute('aria-label', 'Jump to section');
    bar.innerHTML = items.map(function (x) { return '<a href="#' + x[0] + '">' + x[1] + '</a>'; }).join('');
    hero.parentNode.insertBefore(bar, hero.nextSibling);
    var links = [].slice.call(bar.querySelectorAll('a'));
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
        e.preventDefault(); t.scrollIntoView({ behavior: beh, block: 'start' });
      });
    });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id; a.classList.toggle('on', on);
          if (on && MQ.matches) bar.scrollTo({ left: a.offsetLeft - 10, behavior: beh });
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    items.forEach(function (x) { var t = document.getElementById(x[0]); if (t) io.observe(t); });
  }

  function toTop() {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'to-top'; b.setAttribute('aria-label', 'Back to top'); b.textContent = '↑';
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: beh }); });
    document.body.appendChild(b);
    var t;
    window.addEventListener('scroll', function () {
      if (t) return;
      t = setTimeout(function () { t = null; b.classList.toggle('show', window.scrollY > window.innerHeight * 1.5); }, 120);
    }, { passive: true });
  }

  function run() { folds(); tileDots(); jumpbar(); toTop(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
