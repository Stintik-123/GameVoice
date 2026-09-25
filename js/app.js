(function () {
  'use strict';

  const REPO = 'Stintik-123/GameVoice';
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get: function (k, fb) {
      try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }
      catch (e) { return fb; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
  };

  const state = {
    favorites: new Set(store.get('gv_favorites', [])),
    history: store.get('gv_history', []),
    userRatings: store.get('gv_ratings', {}),
    view: store.get('gv_view', 'grid'),
    filters: { chip: null, genre: '', status: '', platform: '', sort: 'rating' },
    query: '',
    heroId: null
  };

  const translitMap = [
    ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['ё', 'e'],
    ['ж', 'zh'], ['з', 'z'], ['и', 'i'], ['й', 'y'], ['к', 'k'], ['л', 'l'], ['м', 'm'],
    ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'], ['с', 's'], ['т', 't'], ['у', 'u'],
    ['ф', 'f'], ['х', 'h'], ['ц', 'c'], ['ч', 'ch'], ['ш', 'sh'], ['щ', 'sch'],
    ['ъ', ''], ['ы', 'y'], ['ь', ''], ['э', 'e'], ['ю', 'yu'], ['я', 'ya']
  ];

  function translit(str) {
    let out = String(str).toLowerCase();
    for (let i = 0; i < translitMap.length; i++) {
      out = out.split(translitMap[i][0]).join(translitMap[i][1]);
    }
    return out;
  }

  function gameById(id) {
    for (let i = 0; i < games.length; i++) if (games[i].id === id) return games[i];
    return null;
  }

  function matchesQuery(g, q) {
    if (!q) return true;
    const hay = translit([g.title, g.subtitle || '', g.developer || '', g.genre || ''].concat(g.tags || []).join(' '));
    return hay.indexOf(translit(q)) !== -1;
  }

  function matchesFilters(g) {
    const f = state.filters;
    if (f.chip && !g.translations.some(function (t) { return t.type === f.chip; })) return false;
    if (f.genre && g.genre !== f.genre) return false;
    if (f.status && !g.translations.some(function (t) { return t.status === f.status; })) return false;
    if (f.platform && (g.platforms || []).indexOf(f.platform) === -1) return false;
    return true;
  }

  function sortGames(list) {
    const s = state.filters.sort;
    const copy = list.slice();
    if (s === 'rating') copy.sort(function (a, b) { return GV.ratingOf(b) - GV.ratingOf(a); });
    else if (s === 'updated') copy.sort(function (a, b) { return GV.lastUpdated(b).localeCompare(GV.lastUpdated(a)); });
    else if (s === 'year') copy.sort(function (a, b) { return (b.year || '').localeCompare(a.year || ''); });
    else if (s === 'count') copy.sort(function (a, b) { return GV.translationCount(b) - GV.translationCount(a); });
    else if (s === 'alpha') copy.sort(function (a, b) { return a.title.localeCompare(b.title, 'ru'); });
    return copy;
  }

  function getFiltered() {
    return sortGames(games.filter(function (g) { return matchesQuery(g, state.query) && matchesFilters(g); }));
  }

  function renderCatalog() {
    const list = getFiltered();
    const wrap = $('#carousel');
    const count = $('#resultsCount');
    if (count) count.textContent = 'найдено: ' + list.length + ' из ' + games.length;
    if (wrap) {
      wrap.innerHTML = list.length === 0
        ? GV.emptyHTML('Ничего не найдено — попробуйте сбросить фильтры')
        : list.map(function (g, i) { return GV.cardHTML(g, state.favorites.has(g.id), i); }).join('');
    }
    const cw = $('#catalogWrap');
    if (cw) cw.dataset.view = state.view;
  }

  function renderTop10() {
    const el = $('#top10List');
    if (!el) return;
    const list = games.slice().sort(function (a, b) {
      const d = GV.ratingOf(b) - GV.ratingOf(a);
      if (d !== 0) return d;
      return GV.translationCount(b) - GV.translationCount(a);
    }).slice(0, 10);
    el.innerHTML = list.map(function (g, i) { return GV.topItemHTML(g, i); }).join('');
  }

  function renderNews() {
    const el = $('#newsGrid');
    if (!el) return;
    el.innerHTML = GV.newsHTML();
  }

  function renderFavorites() {
    const list = games.filter(function (g) { return state.favorites.has(g.id); });
    const c = $('#favCount');
    if (c) c.textContent = String(list.length);
    const m = $('[data-favcount-mirror]');
    if (m) m.textContent = String(list.length);
    const sec = $('#favoritesSection');
    const grid = $('#favoritesGrid');
    if (!sec || !grid) return;
    if (!list.length) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    grid.innerHTML = list.map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderHistory() {
    const list = state.history.map(function (id) { return gameById(id); }).filter(Boolean);
    const sec = $('#historySection');
    const grid = $('#historyGrid');
    if (!sec || !grid) return;
    if (!list.length) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    grid.innerHTML = list.map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderStats() {
    const el = $('#statsRow');
    if (el) el.innerHTML = GV.statsHTML();
  }

  function renderHero(g) {
    if (!g) return;
    state.heroId = g.id;
    const badge = $('#heroBadge');
    const title = $('#heroTitle');
    const desc = $('#heroDesc');
    const meta = $('#heroMeta');
    const tags = $('#heroTags');
    const bg = $('#heroBg');
    const favBtn = $('#favBtn');
    const dots = $('#heroDots');

    if (badge) badge.textContent = 'В каталоге · ' + g.developer;
    if (title) title.textContent = g.title + (g.subtitle ? ' ' + g.subtitle : '');
    if (desc) desc.textContent = g.desc || '';
    if (meta) {
      const p = (g.platforms || []).join(' · ').toUpperCase();
      meta.innerHTML = '<span>' + g.genre + '</span>' +
        '<span>' + g.year + '</span>' +
        '<span>' + GV.translationCount(g) + ' вариантов</span>' +
        (p ? '<span>' + p + '</span>' : '') +
        '<span><b>★ ' + GV.ratingOf(g).toFixed(1) + '</b></span>';
    }
    if (tags) tags.innerHTML = (g.tags || []).map(function (t) { return '<span>#' + t + '</span>'; }).join('');
    if (bg) bg.style.cssText = GV.coverStyle(g);
    if (favBtn) {
      const isFav = state.favorites.has(g.id);
      favBtn.setAttribute('aria-pressed', String(isFav));
      favBtn.textContent = isFav ? '★ В избранном' : '☆ В избранное';
    }
    if (dots) {
      dots.innerHTML = games.map(function (gg) {
        return '<button type="button" role="tab" aria-selected="' + (gg.id === g.id) + '" aria-label="' + gg.title + '"></button>';
      }).join('');
      $$('#heroDots button').forEach(function (btn, i) {
        btn.addEventListener('click', function () { renderHero(games[i]); });
      });
    }
  }

  function pushHistory(id) {
    state.history = [id].concat(state.history.filter(function (x) { return x !== id; })).slice(0, 8);
    store.set('gv_history', state.history);
    renderHistory();
  }

  function openDetails(id, scroll) {
    const g = gameById(id);
    if (!g) return;
    state.heroId = g.id;
    const t = $('#detailsTitle');
    const l = $('#translationsList');
    if (t) t.textContent = 'Варианты локализации — ' + g.title;
    if (l) {
      l.innerHTML = g.translations.map(function (tr, i) {
        const key = g.id + ':' + i;
        return GV.translationHTML(g, tr, i, state.userRatings[key] || 0);
      }).join('');
    }
    $$('.rating-stars').forEach(function (box) {
      box.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-n]');
        if (!btn) return;
        const n = Number(btn.dataset.n);
        state.userRatings[box.dataset.key] = n;
        store.set('gv_ratings', state.userRatings);
        $$('button', box).forEach(function (b) {
          b.classList.toggle('filled', Number(b.dataset.n) <= n);
        });
      });
    });
    pushHistory(g.id);
    if (location.hash !== '#' + g.id) history.replaceState(null, '', '#' + g.id);
    renderHero(g);
    if (scroll) {
      const d = $('#details');
      if (d) d.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    store.set('gv_favorites', Array.from(state.favorites));
    renderFavorites();
    renderCatalog();
    const g = gameById(id);
    if (g && state.heroId === id) renderHero(g);
    showToast(state.favorites.has(id) ? 'Добавлено в избранное' : 'Убрано из избранного');
  }

  let lastFocused = null;
  function openModal(m) {
    if (!m) return;
    lastFocused = document.activeElement;
    m.classList.add('open');
    const f = m.querySelector('button, input, select, textarea, a[href]');
    (f || m).focus && (f || m).focus();
  }
  function closeModal(m) {
    if (!m) return;
    m.classList.remove('open');
    if (m.id === 'trailerModal') {
      const f = $('#videoFrame');
      if (f) f.innerHTML = '';
    }
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function closeAllModals() { $$('.modal.open').forEach(closeModal); }

  function openTrailer(g) {
    if (!g || !g.trailerId) return;
    const m = $('#trailerModal');
    const t = $('#trailerTitle');
    const tabs = $('#videoTabs');
    const f = $('#videoFrame');
    if (!m || !tabs || !f) return;
    if (t) t.textContent = 'Трейлер — ' + g.title;
    const all = [{ id: g.trailerId, label: 'Основной' }].concat(g.extraTrailers || []);
    tabs.innerHTML = all.map(function (x, i) {
      return '<button type="button" data-id="' + x.id + '" class="' + (i === 0 ? 'active' : '') + '">' + x.label + '</button>';
    }).join('');
    const setF = function (id) {
      f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Трейлер ' + g.title + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    };
    setF(all[0].id);
    $$('#videoTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#videoTabs button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        setF(b.dataset.id);
      });
    });
    openModal(m);
  }

  let toastTimer;
  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function populateFilters() {
    const genres = Array.from(new Set(games.map(function (g) { return g.genre; }).filter(Boolean))).sort();
    const platforms = Array.from(new Set(games.reduce(function (a, g) { return a.concat(g.platforms || []); }, []))).sort();
    const gs = $('#filterGenre'), ss = $('#filterStatus'), ps = $('#filterPlatform'), so = $('#sortBy');
    if (gs) gs.innerHTML = '<option value="">Все жанры</option>' + genres.map(function (g) { return '<option value="' + g + '">' + g + '</option>'; }).join('');
    if (ss) ss.innerHTML = '<option value="">Любой статус</option><option value="done">Готово</option><option value="progress">В работе</option><option value="abandoned">Заброшено</option>';
    if (ps) ps.innerHTML = '<option value="">Все платформы</option>' + platforms.map(function (p) { return '<option value="' + p + '">' + p.toUpperCase() + '</option>'; }).join('');
    if (so) so.innerHTML = '<option value="rating">Сначала рейтинг</option><option value="updated">Сначала обновлённые</option><option value="year">Сначала новые</option><option value="count">Больше вариантов</option><option value="alpha">По алфавиту</option>';
  }

  function wireView() {
    const btns = $$('.view-toggle button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.view = b.dataset.view;
        store.set('gv_view', state.view);
        btns.forEach(function (x) { x.classList.toggle('active', x === b); });
        renderCatalog();
      });
    });
    const cur = $('.view-toggle button[data-view="' + state.view + '"]');
    if (cur) { btns.forEach(function (b) { b.classList.remove('active'); }); cur.classList.add('active'); }
  }

  function wireChips() {
    $$('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        const on = !c.classList.contains('active');
        $$('.chip').forEach(function (x) { x.classList.remove('active'); });
        if (on) c.classList.add('active');
        state.filters.chip = on ? c.dataset.chip : null;
        renderCatalog();
      });
    });
  }

  function wireSelects() {
    const gs = $('#filterGenre'), ss = $('#filterStatus'), ps = $('#filterPlatform'), so = $('#sortBy');
    if (gs) gs.addEventListener('change', function (e) { state.filters.genre = e.target.value; renderCatalog(); });
    if (ss) ss.addEventListener('change', function (e) { state.filters.status = e.target.value; renderCatalog(); });
    if (ps) ps.addEventListener('change', function (e) { state.filters.platform = e.target.value; renderCatalog(); });
    if (so) so.addEventListener('change', function (e) { state.filters.sort = e.target.value; renderCatalog(); renderTop10(); });
  }

  function wireReset() {
    const b = $('#resetFilters');
    if (!b) return;
    b.addEventListener('click', function () {
      state.filters = { chip: null, genre: '', status: '', platform: '', sort: 'rating' };
      state.query = '';
      const i = $('#searchInput'), c = $('#searchClear');
      if (i) i.value = '';
      if (c) c.hidden = true;
      $$('.chip').forEach(function (x) { x.classList.remove('active'); });
      $$('.selects select').forEach(function (s) { s.value = ''; });
      const so = $('#sortBy');
      if (so) so.value = 'rating';
      renderCatalog();
    });
  }

  function wireSearch() {
    const i = $('#searchInput'), c = $('#searchClear');
    if (!i) return;
    let t;
    i.addEventListener('input', function () {
      clearTimeout(t);
      if (c) c.hidden = !i.value;
      t = setTimeout(function () {
        state.query = i.value.trim();
        renderCatalog();
      }, 120);
    });
    if (c) c.addEventListener('click', function () {
      i.value = ''; state.query = ''; c.hidden = true; renderCatalog(); i.focus();
    });
  }

  function wireCards() {
    document.addEventListener('click', function (e) {
      const fav = e.target.closest('[data-fav]');
      if (fav) { e.stopPropagation(); toggleFavorite(fav.dataset.fav); return; }
      const mini = e.target.closest('.mini-card');
      if (mini) { openDetails(mini.dataset.id, true); return; }
      const top = e.target.closest('.top-item');
      if (top) { openDetails(top.dataset.id, true); return; }
      const news = e.target.closest('.news-card');
      if (news) { openDetails(news.dataset.id, true); return; }
      const card = e.target.closest('.game-card');
      if (card) openDetails(card.dataset.id, true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      const el = e.target;
      if (el.classList && (el.classList.contains('game-card') || el.classList.contains('top-item'))) {
        openDetails(el.dataset.id, true);
      }
    });
  }

  function wireModals() {
    $$('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { closeModal(b.closest('.modal')); });
    });
    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) { if (e.target === m) closeModal(m); });
    });
    [['#addBtn', '#addModal'], ['#addBtnMobile', '#addModal'], ['#faqBtn', '#faqModal'], ['#faqBtnMobile', '#faqModal']].forEach(function (p) {
      const b = $(p[0]), m = $(p[1]);
      if (b && m) b.addEventListener('click', function () { openModal(m); });
    });
  }

  function wireAddForm() {
    const f = $('#addForm');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(f);
      const d = {};
      fd.forEach(function (v, k) { d[k] = v; });
      const title = encodeURIComponent('[Предложение] ' + (d.title || 'Новая игра'));
      const body = encodeURIComponent('**Игра:** ' + (d.title || '') + '\n**Тип:** ' + (d.type || '') + '\n**Автор/студия:** ' + (d.author || '—') + '\n**Ссылка:** ' + (d.url || '—') + '\n\n' + (d.comment || ''));
      window.open('https://github.com/' + REPO + '/issues/new?title=' + title + '&body=' + body, '_blank', 'noopener');
      f.reset();
      closeModal($('#addModal'));
      showToast('Открыто окно создания issue на GitHub');
    });
  }

  function wireHero() {
    const tb = $('#heroTrailerBtn'), gb = $('#gotoDetailsBtn'), fb = $('#favBtn');
    if (tb) tb.addEventListener('click', function () { const g = gameById(state.heroId); if (g) openTrailer(g); });
    if (gb) gb.addEventListener('click', function () { if (state.heroId) openDetails(state.heroId, true); });
    if (fb) fb.addEventListener('click', function () { if (state.heroId) toggleFavorite(state.heroId); });
  }

  function wireRandom() {
    const b = $('#randomBtn');
    if (!b) return;
    b.addEventListener('click', function () {
      const g = games[Math.floor(Math.random() * games.length)];
      renderHero(g);
      const h = $('#hero');
      if (h) h.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function updateThemeBtn() {
    const b = $('#themeBtn');
    if (!b) return;
    const cur = document.documentElement.dataset.theme;
    const dark = cur === 'dark' || (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
    b.textContent = dark ? '☀' : '🌙';
  }

  function wireTheme() {
    const saved = store.get('gv_theme', null);
    if (saved) document.documentElement.dataset.theme = saved;
    updateThemeBtn();
    const b = $('#themeBtn');
    if (!b) return;
    b.addEventListener('click', function () {
      const cur = document.documentElement.dataset.theme;
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const eff = cur || (sys ? 'dark' : 'light');
      const next = eff === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      store.set('gv_theme', next);
      updateThemeBtn();
    });
  }

  function wireBurger() {
    const b = $('#burgerBtn'), m = $('#mobileMenu');
    if (!b || !m) return;
    b.addEventListener('click', function () {
      const open = !m.classList.contains('open');
      m.classList.toggle('open', open);
      m.hidden = !open;
      b.setAttribute('aria-expanded', String(open));
    });
    $$('.mobile-menu a, .mobile-menu button').forEach(function (el) {
      el.addEventListener('click', function () {
        m.classList.remove('open');
        m.hidden = true;
        b.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function wireToTop() {
    const b = $('#toTop');
    if (!b) return;
    window.addEventListener('scroll', function () {
      b.classList.toggle('show', window.scrollY > 800);
    }, { passive: true });
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function wireHotkeys() {
    document.addEventListener('keydown', function (e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        const i = $('#searchInput');
        if (i) i.focus();
      } else if (e.key === 'Escape') {
        closeAllModals();
        const m = $('#mobileMenu');
        if (m && m.classList.contains('open')) {
          m.classList.remove('open');
          m.hidden = true;
          const b = $('#burgerBtn');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
        const i = $('#searchInput');
        if (i && document.activeElement === i) i.blur();
      }
    });
  }

  function handleDeepLink() {
    const h = location.hash.replace('#', '');
    if (!h) return false;
    const g = gameById(h);
    if (!g) return false;
    openDetails(g.id, false);
    return true;
  }

  function init() {
    populateFilters();
    renderStats();
    renderTop10();
    renderNews();
    renderFavorites();
    renderHistory();
    renderCatalog();

    wireView();
    wireChips();
    wireSelects();
    wireReset();
    wireSearch();
    wireCards();
    wireModals();
    wireAddForm();
    wireHero();
    wireRandom();
    wireTheme();
    wireBurger();
    wireToTop();
    wireHotkeys();

    if (!handleDeepLink()) renderHero(games[0]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
