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
    filters: store.get('gv_filters', { chip: null, genre: '', status: '', sort: 'updated' }),
    query: '',
    heroId: null
  };

  function gameById(id) {
    for (let i = 0; i < games.length; i++) if (games[i].id === id) return games[i];
    return null;
  }

  function matchesQuery(g, q) {
    if (!q) return true;
    const needle = q.toLowerCase().trim();
    const parts = [g.title || '', g.subtitle || '', g.developer || '', g.genre || '', g.year || ''].concat(g.tags || []).concat(g.aliases || []);
    return parts.join(' ').toLowerCase().indexOf(needle) !== -1;
  }

  function matchesFilters(g) {
    const f = state.filters;
    if (f.chip) {
      var chipOk = g.translations.some(function (t) {
        if (f.chip === 'voice') return t.type === 'voice' || t.type === 'both';
        if (f.chip === 'text') return t.type === 'text' || t.type === 'both';
        return t.type === f.chip;
      });
      if (!chipOk) return false;
    }
    if (f.genre && g.genre !== f.genre) return false;
    if (f.status && !g.translations.some(function (t) { return t.status === f.status; })) return false;
    return true;
  }

  function sortGames(list) {
    const s = state.filters.sort;
    const copy = list.slice();
    if (s === 'updated') copy.sort(function (a, b) { return GV.lastUpdated(b).localeCompare(GV.lastUpdated(a)); });
    else if (s === 'year') copy.sort(function (a, b) { return (b.year || '').localeCompare(a.year || ''); });
    else if (s === 'count') copy.sort(function (a, b) { return GV.translationCount(b) - GV.translationCount(a); });
    else if (s === 'alpha') copy.sort(function (a, b) { return a.title.localeCompare(b.title, 'ru'); });
    else copy.sort(function (a, b) { return GV.lastUpdated(b).localeCompare(GV.lastUpdated(a)); });
    return copy;
  }

  function getFiltered() {
    return sortGames(games.filter(function (g) { return matchesQuery(g, state.query) && matchesFilters(g); }));
  }

  let heroCarouselTimer = null;
  let heroHovering = false;
  const isDesktopVideo = window.matchMedia('(min-width: 900px)').matches;

  function heroIndex() {
    for (let i = 0; i < games.length; i++) if (games[i].id === state.heroId) return i;
    return 0;
  }

  function stopHeroCarousel() {
    if (heroCarouselTimer) { clearInterval(heroCarouselTimer); heroCarouselTimer = null; }
  }

  function startHeroCarousel() {
    stopHeroCarousel();
    if (reduceMotion || games.length < 2 || heroHovering) return;
    heroCarouselTimer = setInterval(function () {
      if (heroHovering) return;
      renderHero(games[(heroIndex() + 1) % games.length], true);
    }, 40000);
  }

  function setHeroVideo(g) {
    if (!isDesktopVideo || reduceMotion || !g || !g.trailerId) { clearHeroVideo(); return; }
    const wrap = $('#heroVideo');
    if (!wrap) return;
    if (wrap.dataset.id === g.trailerId) { wrap.classList.add('is-on'); return; }
    wrap.dataset.id = g.trailerId;
    wrap.classList.add('is-on');
    const id = g.trailerId;
    wrap.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=' + id + '" title="" allow="autoplay; encrypted-media" tabindex="-1"></iframe>';
  }

  function clearHeroVideo() {
    const wrap = $('#heroVideo');
    if (!wrap) return;
    wrap.classList.remove('is-on');
    wrap.innerHTML = '';
    delete wrap.dataset.id;
  }

  function renderCatalog() {
    const list = getFiltered();
    const wrap = $('#carousel');
    const count = $('#resultsCount');
    if (count) count.textContent = 'найдено: ' + list.length + ' из ' + games.length;
    if (wrap) {
      if (list.length === 0) {
        wrap.innerHTML = state.query
          ? '<div class="empty-state"><p>Ничего не найдено по запросу «' + GV.escapeHTML(state.query) + '»</p><p>Попробуйте другое название или сбросьте фильтры</p></div>'
          : '<div class="empty-state"><p>Ничего не найдено</p><p>Сбросьте фильтры или измените параметры поиска</p></div>';
      } else {
        wrap.innerHTML = list.map(function (g, i) { return GV.cardHTML(g, state.favorites.has(g.id), i, state.query); }).join('');
      }
    }
    const cw = $('#catalogWrap');
    if (cw) cw.dataset.view = state.view;
    updateChipCounts();
  }

  function updateChipCounts() {
    const counts = {
      text: games.filter(function (g) { return g.translations.some(function (t) { return t.type === 'text' || t.type === 'both'; }); }).length,
      voice: games.filter(function (g) { return g.translations.some(function (t) { return t.type === 'voice' || t.type === 'both'; }); }).length,
      both: games.filter(function (g) { return g.translations.some(function (t) { return t.type === 'both'; }); }).length,
      subtitles: 0
    };
    $$('.chip[data-chip]').forEach(function (c) {
      const type = c.dataset.chip;
      const base = c.dataset.baseLabel || c.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
      c.dataset.baseLabel = base;
      c.textContent = base + ' (' + (counts[type] || 0) + ')';
    });
  }

  function renderNews() {
    const grid = $('#newsGrid');
    if (!grid || typeof GV.newsHTML !== 'function') return;
    grid.innerHTML = GV.newsHTML();
  }

  function renderFavorites() {
    const grid = $('#favoritesGrid');
    const section = $('#favoritesSection');
    const countEl = $('#favCount');
    const n = state.favorites.size;
    if (countEl) countEl.textContent = n;
    const m = $('[data-favcount-mirror]');
    if (m) m.textContent = n;
    if (!grid || !section) return;
    if (!n) { section.style.display = 'none'; grid.innerHTML = ''; return; }
    section.style.display = '';
    grid.innerHTML = Array.from(state.favorites).map(gameById).filter(Boolean).map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderHistory() {
    const grid = $('#historyGrid');
    const section = $('#historySection');
    if (!grid || !section) return;
    const items = state.history.map(gameById).filter(Boolean);
    if (!items.length) { section.style.display = 'none'; grid.innerHTML = ''; return; }
    section.style.display = '';
    grid.innerHTML = items.map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderStats() {
    const row = $('#statsRow');
    if (row) row.innerHTML = GV.statsHTML();
  }

  function renderHero(g, fromCarousel) {
    if (!g) return;
    state.heroId = g.id;
    const badge = $('#heroBadge'), title = $('#heroTitle'), desc = $('#heroDesc'), meta = $('#heroMeta'), tags = $('#heroTags'), bg = $('#heroBg'), favBtn = $('#favBtn'), dots = $('#heroDots');
    if (badge) badge.textContent = 'В каталоге · ' + g.developer;
    if (title) title.textContent = g.title + (g.subtitle ? ' ' + g.subtitle : '');
    if (desc) desc.textContent = g.desc || '';
    if (meta) {
      const p = (g.platforms || []).join(' · ').toUpperCase();
      meta.innerHTML = '<span>' + g.genre + '</span><span>' + g.year + '</span><span>' + GV.pluralVariants(GV.translationCount(g)) + '</span>' + (p ? '<span>' + p + '</span>' : '');
    }
    if (tags) tags.innerHTML = (g.tags || []).map(function (t) { return '<span>#' + t + '</span>'; }).join('');
    if (bg) {
      const img = g.heroImage || g.cover;
      bg.style.cssText = img ? 'background-image:url(' + img + ');background-size:cover;background-position:center;' : GV.coverStyle(g);
    }
    if (favBtn) {
      const isFav = state.favorites.has(g.id);
      favBtn.setAttribute('aria-pressed', String(isFav));
      favBtn.textContent = isFav ? '★ В избранном' : '☆ В избранное';
    }
    if (dots) {
      dots.innerHTML = games.map(function (gg) {
        return '<button type="button" role="tab" aria-selected="' + (gg.id === g.id) + '" aria-label="' + GV.escapeHTML(gg.title) + '"></button>';
      }).join('');
      $$('#heroDots button').forEach(function (btn, i) {
        btn.addEventListener('click', function () { renderHero(games[i]); startHeroCarousel(); });
      });
    }
    const tb = $('#heroTrailerBtn'); if (tb) tb.hidden = !g.trailerId;
    if (isDesktopVideo) setHeroVideo(g); else clearHeroVideo();
    if (!fromCarousel) startHeroCarousel();
  }

  function pushHistory(id) {
    state.history = [id].concat(state.history.filter(function (x) { return x !== id; })).slice(0, 8);
    store.set('gv_history', state.history);
    renderHistory();
  }

  function openDetails(id, scroll) {
    const g = gameById(id);
    if (!g) return;
    const list = $('#translationsList');
    const title = $('#detailsTitle');
    if (title) title.textContent = 'Варианты локализации — ' + g.title;
    if (list) list.innerHTML = g.translations.map(function (t, idx) { return GV.translationHTML(g, t, idx, 0); }).join('');
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
    document.body.style.overflow = 'hidden';
    const f = m.querySelector('button, input, select, textarea, a[href]');
    if (f && f.focus) f.focus();
  }
  function closeModal(m) {
    if (!m) return;
    m.classList.remove('open');
    if (m.id === 'trailerModal') { const f = $('#videoFrame'); if (f) f.innerHTML = ''; }
    if (!$$('.modal.open').length) document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function closeAllModals() {
    $$('.modal.open').forEach(closeModal);
    document.body.style.overflow = '';
  }

  function openTrailer(g) {
    if (!g || !g.trailerId) return;
    const m = $('#trailerModal'), t = $('#trailerTitle'), tabs = $('#videoTabs'), f = $('#videoFrame');
    if (!m || !tabs || !f) return;
    if (t) t.textContent = 'Трейлер — ' + g.title;
    const all = [{ id: g.trailerId, label: 'Основной' }].concat(g.extraTrailers || []);
    tabs.innerHTML = all.map(function (x, i) {
      return '<button type="button" data-id="' + x.id + '" class="' + (i === 0 ? 'active' : '') + '">' + GV.escapeHTML(x.label) + '</button>';
    }).join('');
    const setF = function (id) {
      f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Трейлер ' + GV.escapeHTML(g.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
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

  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function populateFilters() {
    const genres = [];
    games.forEach(function (g) { if (g.genre && genres.indexOf(g.genre) === -1) genres.push(g.genre); });
    const fg = $('#filterGenre');
    if (fg) {
      fg.innerHTML = '<option value="">Все жанры</option>' + genres.map(function (g) { return '<option value="' + GV.escapeHTML(g) + '">' + GV.escapeHTML(g) + '</option>'; }).join('');
      fg.value = state.filters.genre || '';
    }
    const fs = $('#filterStatus');
    if (fs) {
      fs.innerHTML = '<option value="">Любой статус</option><option value="done">Готово</option><option value="progress">В работе</option><option value="abandoned">Заброшено</option>';
      fs.value = state.filters.status || '';
    }
    const so = $('#sortBy');
    if (so) {
      so.innerHTML = '<option value="updated">Сначала обновлённые</option><option value="year">Сначала новые</option><option value="count">Больше вариантов</option><option value="alpha">По алфавиту</option>';
      so.value = state.filters.sort || 'updated';
    }
    $$('#chips .chip').forEach(function (c) { c.classList.toggle('active', c.dataset.chip === state.filters.chip); });
    $$('.view-toggle button').forEach(function (b) { b.classList.toggle('active', b.dataset.view === state.view); });
  }

  function saveFilters() {
    store.set('gv_filters', state.filters);
    store.set('gv_view', state.view);
  }

  function wireView() {
    $$('.view-toggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.view = b.dataset.view;
        $$('.view-toggle button').forEach(function (x) { x.classList.toggle('active', x === b); });
        saveFilters();
        renderCatalog();
      });
    });
  }

  function wireChips() {
    $$('#chips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        if (state.filters.chip === c.dataset.chip) state.filters.chip = null;
        else state.filters.chip = c.dataset.chip;
        $$('#chips .chip').forEach(function (x) { x.classList.toggle('active', x.dataset.chip === state.filters.chip); });
        saveFilters();
        renderCatalog();
      });
    });
  }

  function wireSelects() {
    const gs = $('#filterGenre'), ss = $('#filterStatus'), so = $('#sortBy');
    if (gs) gs.addEventListener('change', function (e) { state.filters.genre = e.target.value; saveFilters(); renderCatalog(); });
    if (ss) ss.addEventListener('change', function (e) { state.filters.status = e.target.value; saveFilters(); renderCatalog(); });
    if (so) so.addEventListener('change', function (e) { state.filters.sort = e.target.value; saveFilters(); renderCatalog(); });
  }

  function wireReset() {
    const b = $('#resetFilters');
    if (!b) return;
    b.addEventListener('click', function () {
      state.filters = { chip: null, genre: '', status: '', sort: 'updated' };
      state.query = '';
      const si = $('#searchInput'); if (si) si.value = '';
      const sc = $('#searchClear'); if (sc) sc.hidden = true;
      saveFilters();
      populateFilters();
      renderCatalog();
    });
  }

  function wireSearch() {
    const i = $('#searchInput');
    const c = $('#searchClear');
    if (!i) return;
    let t;
    i.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.query = i.value;
        if (c) c.hidden = !i.value;
        renderCatalog();
      }, 180);
    });
    if (c) c.addEventListener('click', function () {
      i.value = ''; state.query = ''; c.hidden = true; renderCatalog(); i.focus();
    });
  }

  function wireCards() {
    document.addEventListener('click', function (e) {
      const fav = e.target.closest('[data-fav]');
      if (fav) { e.preventDefault(); e.stopPropagation(); toggleFavorite(fav.dataset.fav); return; }
      const card = e.target.closest('.game-card[data-id], .top-item[data-id], .mini-card[data-id], .news-card[data-id]');
      if (card) openDetails(card.dataset.id, true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('[data-fav]')) return;
      const card = e.target.closest('.game-card[data-id], .top-item[data-id]');
      if (!card) return;
      e.preventDefault();
      openDetails(card.dataset.id, true);
    });
  }

  function openAbout() {
    openModal($('#aboutModal'));
  }

  function wireModals() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeAllModals(); return; }
      if (e.target.classList.contains('modal')) closeAllModals();
    });
    const faq = $('#faqBtn'); if (faq) faq.addEventListener('click', function () { openModal($('#faqModal')); });
    const faqM = $('#faqBtnMobile'); if (faqM) faqM.addEventListener('click', function () { openModal($('#faqModal')); });
    const add = $('#addBtn'); if (add) add.addEventListener('click', function () { openModal($('#addModal')); });
    const addM = $('#addBtnMobile'); if (addM) addM.addEventListener('click', function () { openModal($('#addModal')); });
    ['aboutBtn', 'aboutBtnMobile', 'aboutBtnFooter', 'aboutOpenBtn'].forEach(function (id) {
      const el = $('#' + id);
      if (el) el.addEventListener('click', function (e) { e.preventDefault(); openAbout(); });
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
    const hero = $('#hero');
    if (hero) {
      hero.addEventListener('mouseenter', function () { heroHovering = true; stopHeroCarousel(); });
      hero.addEventListener('mouseleave', function () { heroHovering = false; startHeroCarousel(); });
    }
  }

  function wireFab() {
    const fab = $('#fabAdd');
    if (!fab) return;
    fab.addEventListener('click', function () { openModal($('#addModal')); });
  }

  function wireMenu() {
    const btn = $('#menuBtn'), menu = $('#mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  function wireTheme() {
    const btn = $('#themeBtn');
    const root = document.documentElement;
    const saved = store.get('gv_theme', null);
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    if (btn) btn.addEventListener('click', function () {
      const cur = root.getAttribute('data-theme');
      const next = cur === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      store.set('gv_theme', next);
    });
  }

  function handleDeepLink() {
    const id = (location.hash || '').replace(/^#/, '');
    if (!id) return false;
    const g = gameById(id);
    if (!g) return false;
    openDetails(id, true);
    return true;
  }

  function init() {
    if (typeof games === 'undefined') return;
    populateFilters();
    wireView();
    wireChips();
    wireSelects();
    wireReset();
    wireSearch();
    wireCards();
    wireModals();
    wireAddForm();
    wireHero();
    wireFab();
    wireMenu();
    wireTheme();
    renderCatalog();
    renderFavorites();
    renderHistory();
    renderStats();
    renderNews();
    if (!handleDeepLink()) renderHero(games[0]);
    window.addEventListener('hashchange', handleDeepLink);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
