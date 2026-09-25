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
    filters: store.get('gv_filters', { chip: null, genre: '', status: '', platform: '', sort: 'rating' }),
    query: '',
    heroId: null
  };

  function gameById(id) {
    for (let i = 0; i < games.length; i++) if (games[i].id === id) return games[i];
    return null;
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, q) {
    const safe = escapeHTML(text);
    if (!q || !q.trim()) return safe;
    const re = new RegExp('(' + escapeRegExp(escapeHTML(q.trim())) + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function matchesQuery(g, q) {
    if (!q) return true;
    const needle = q.toLowerCase().trim();
    const parts = [
      g.title || '',
      g.subtitle || '',
      g.developer || '',
      g.genre || '',
      g.year || ''
    ].concat(g.tags || []).concat(g.aliases || []);
    const hay = parts.join(' ').toLowerCase();
    return hay.indexOf(needle) !== -1;
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
    copy.sort(function (a, b) {
      if (s === 'rating') return GV.ratingOf(b) - GV.ratingOf(a);
      if (s === 'year') return String(b.year).localeCompare(String(a.year));
      if (s === 'variants') return GV.translationCount(b) - GV.translationCount(a);
      if (s === 'updated') return GV.lastUpdated(b).localeCompare(GV.lastUpdated(a));
      if (s === 'title') return a.title.localeCompare(b.title, 'ru');
      return 0;
    });
    return copy;
  }

  function filteredGames() {
    return sortGames(games.filter(function (g) {
      return matchesQuery(g, state.query) && matchesFilters(g);
    }));
  }

  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function renderStats() {
    const row = $('#statsRow');
    if (row) row.innerHTML = GV.statsHTML();
  }

  function renderTop10() {
    const list = $('#top10List');
    if (!list) return;
    const sorted = games.slice().sort(function (a, b) { return GV.ratingOf(b) - GV.ratingOf(a); }).slice(0, 10);
    list.innerHTML = sorted.map(function (g, i) { return GV.topItemHTML(g, i); }).join('');
  }

  function renderNews() {
    const grid = $('#newsGrid');
    if (grid) grid.innerHTML = GV.newsHTML();
  }

  function renderFavorites() {
    const grid = $('#favoritesGrid');
    const section = $('#favoritesSection');
    const count = $('#favCount');
    const n = state.favorites.size;
    if (count) count.textContent = n;
    $$('[data-favcount-mirror]').forEach(function (el) { el.textContent = n; });
    if (!grid || !section) return;
    if (!n) {
      section.style.display = 'none';
      grid.innerHTML = '';
      return;
    }
    section.style.display = '';
    const items = Array.from(state.favorites).map(gameById).filter(Boolean);
    grid.innerHTML = items.map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderHistory() {
    const grid = $('#historyGrid');
    const section = $('#historySection');
    if (!grid || !section) return;
    const items = state.history.map(gameById).filter(Boolean);
    if (!items.length) {
      section.style.display = 'none';
      grid.innerHTML = '';
      return;
    }
    section.style.display = '';
    grid.innerHTML = items.map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderCatalog() {
    const wrap = $('#catalogWrap');
    const carousel = $('#carousel');
    const countEl = $('#resultsCount');
    if (!wrap || !carousel) return;
    const list = filteredGames();
    if (countEl) countEl.textContent = 'найдено: ' + list.length + ' из ' + games.length;
    wrap.dataset.view = state.view;
    if (!list.length) {
      carousel.innerHTML = GV.emptyHTML('Ничего не найдено — сбросьте фильтры или измените запрос');
      return;
    }
    carousel.innerHTML = list.map(function (g, i) {
      return GV.cardHTML(g, state.favorites.has(g.id), i, state.query);
    }).join('');
  }

  let heroCarouselTimer = null;
  let heroHovering = false;
  const canHoverVideo = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function heroIndex() {
    for (let i = 0; i < games.length; i++) if (games[i].id === state.heroId) return i;
    return 0;
  }

  function stopHeroCarousel() {
    if (heroCarouselTimer) {
      clearInterval(heroCarouselTimer);
      heroCarouselTimer = null;
    }
  }

  function startHeroCarousel() {
    stopHeroCarousel();
    if (reduceMotion || games.length < 2 || heroHovering) return;
    heroCarouselTimer = setInterval(function () {
      if (heroHovering) return;
      const next = games[(heroIndex() + 1) % games.length];
      renderHero(next, true);
    }, 7000);
  }

  function setHeroVideo(g) {
    if (!canHoverVideo || !g || !g.trailerId) {
      clearHeroVideo();
      return;
    }
    let wrap = $('#heroVideo');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'heroVideo';
      wrap.className = 'hero-video';
      wrap.setAttribute('aria-hidden', 'true');
      const hero = $('#hero');
      const bg = $('#heroBg');
      if (bg && bg.parentNode) bg.parentNode.insertBefore(wrap, bg.nextSibling);
      else if (hero) hero.insertBefore(wrap, hero.firstChild);
    }
    if (wrap.dataset.id === g.trailerId) {
      wrap.classList.add('is-on');
      return;
    }
    wrap.dataset.id = g.trailerId;
    wrap.classList.add('is-on');
    const id = g.trailerId;
    wrap.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=' + id +
      '" title="" allow="autoplay; encrypted-media" tabindex="-1"></iframe>';
  }

  function clearHeroVideo() {
    const wrap = $('#heroVideo');
    if (!wrap) return;
    wrap.classList.remove('is-on');
    wrap.innerHTML = '';
    delete wrap.dataset.id;
  }

  function renderHero(g, fromCarousel) {
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
        return '<button type="button" role="tab" aria-selected="' + (gg.id === g.id) + '" aria-label="' + escapeHTML(gg.title) + '"></button>';
      }).join('');
      $$('#heroDots button').forEach(function (btn, i) {
        btn.addEventListener('click', function () {
          renderHero(games[i]);
          startHeroCarousel();
        });
      });
    }
    if (heroHovering) setHeroVideo(g);
    if (!fromCarousel) startHeroCarousel();
  }

  function pushHistory(id) {
    state.history = [id].concat(state.history.filter(function (x) { return x !== id; })).slice(0, 8);
    store.set('gv_history', state.history);
    renderHistory();
  }

  function findSimilar(g, limit) {
    const result = [];
    for (let i = 0; i < games.length; i++) {
      const other = games[i];
      if (other.id === g.id) continue;
      let score = 0;
      if (other.genre === g.genre) score += 2;
      const sharedTags = (other.tags || []).filter(function (t) { return (g.tags || []).indexOf(t) !== -1; }).length;
      score += sharedTags;
      if (other.developer === g.developer) score += 1;
      if (score > 0) result.push({ game: other, score: score });
    }
    result.sort(function (a, b) { return b.score - a.score; });
    return result.slice(0, limit || 4).map(function (r) { return r.game; });
  }

  function openDetails(id, scroll) {
    const g = gameById(id);
    if (!g) return;
    const list = $('#translationsList');
    const title = $('#detailsTitle');
    if (title) title.textContent = 'Варианты локализации — ' + g.title;
    if (list) {
      list.innerHTML = g.translations.map(function (t, idx) {
        const key = g.id + ':' + idx;
        return GV.translationHTML(g, t, idx, state.userRatings[key] || 0);
      }).join('');
      $$('#translationsList .rating-stars').forEach(function (stars) {
        stars.addEventListener('click', function (e) {
          const btn = e.target.closest('button[data-n]');
          if (!btn) return;
          const n = parseInt(btn.dataset.n, 10);
          const key = stars.dataset.key;
          state.userRatings[key] = n;
          store.set('gv_ratings', state.userRatings);
          $$('#translationsList .rating-stars[data-key="' + key + '"] button').forEach(function (b) {
            b.classList.toggle('filled', parseInt(b.dataset.n, 10) <= n);
          });
          showToast('Оценка сохранена');
        });
      });
    }
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
    if (f && f.focus) f.focus();
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
      f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Трейлер ' + escapeHTML(g.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
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

  function populateFilters() {
    const genres = [];
    const platforms = [];
    games.forEach(function (g) {
      if (g.genre && genres.indexOf(g.genre) === -1) genres.push(g.genre);
      (g.platforms || []).forEach(function (p) {
        if (platforms.indexOf(p) === -1) platforms.push(p);
      });
    });
    const fg = $('#filterGenre');
    if (fg) {
      fg.innerHTML = '<option value="">Все жанры</option>' + genres.map(function (g) {
        return '<option value="' + escapeHTML(g) + '">' + escapeHTML(g) + '</option>';
      }).join('');
      fg.value = state.filters.genre || '';
    }
    const fs = $('#filterStatus');
    if (fs) {
      fs.innerHTML = '<option value="">Любой статус</option>' +
        '<option value="done">Готово</option>' +
        '<option value="progress">В работе</option>' +
        '<option value="abandoned">Заброшено</option>';
      fs.value = state.filters.status || '';
    }
    const fp = $('#filterPlatform');
    if (fp) {
      fp.innerHTML = '<option value="">Все платформы</option>' + platforms.map(function (p) {
        return '<option value="' + escapeHTML(p) + '">' + escapeHTML(p.toUpperCase()) + '</option>';
      }).join('');
      fp.value = state.filters.platform || '';
    }
    const sb = $('#sortBy');
    if (sb) {
      sb.innerHTML = '<option value="rating">Сначала рейтинг</option>' +
        '<option value="updated">По обновлению</option>' +
        '<option value="year">По году</option>' +
        '<option value="variants">По числу вариантов</option>' +
        '<option value="title">По алфавиту</option>';
      sb.value = state.filters.sort || 'rating';
    }
    $$('#chips .chip').forEach(function (c) {
      c.classList.toggle('active', c.dataset.chip === state.filters.chip);
    });
    $$('.view-toggle button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === state.view);
    });
  }

  function persistFilters() {
    store.set('gv_filters', state.filters);
    store.set('gv_view', state.view);
  }

  function wireView() {
    $$('.view-toggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.view = b.dataset.view;
        $$('.view-toggle button').forEach(function (x) { x.classList.toggle('active', x === b); });
        persistFilters();
        renderCatalog();
      });
    });
  }

  function wireChips() {
    $$('#chips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        if (state.filters.chip === c.dataset.chip) state.filters.chip = null;
        else state.filters.chip = c.dataset.chip;
        $$('#chips .chip').forEach(function (x) {
          x.classList.toggle('active', x.dataset.chip === state.filters.chip);
        });
        persistFilters();
        renderCatalog();
      });
    });
  }

  function wireSelects() {
    ['filterGenre', 'filterStatus', 'filterPlatform', 'sortBy'].forEach(function (id) {
      const el = $('#' + id);
      if (!el) return;
      el.addEventListener('change', function () {
        if (id === 'filterGenre') state.filters.genre = el.value;
        if (id === 'filterStatus') state.filters.status = el.value;
        if (id === 'filterPlatform') state.filters.platform = el.value;
        if (id === 'sortBy') state.filters.sort = el.value;
        persistFilters();
        renderCatalog();
      });
    });
  }

  function wireReset() {
    const b = $('#resetFilters');
    if (!b) return;
    b.addEventListener('click', function () {
      state.filters = { chip: null, genre: '', status: '', platform: '', sort: 'rating' };
      state.query = '';
      const si = $('#searchInput');
      if (si) si.value = '';
      const sc = $('#searchClear');
      if (sc) sc.hidden = true;
      persistFilters();
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
      i.value = '';
      state.query = '';
      c.hidden = true;
      renderCatalog();
      i.focus();
    });
  }

  function wireCards() {
    document.addEventListener('click', function (e) {
      const fav = e.target.closest('[data-fav]');
      if (fav) {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(fav.dataset.fav);
        return;
      }
      const card = e.target.closest('.game-card[data-id], .top-item[data-id], .mini-card[data-id], .news-card[data-id]');
      if (card) {
        openDetails(card.dataset.id, true);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.game-card[data-id], .top-item[data-id]');
      if (!card) return;
      e.preventDefault();
      openDetails(card.dataset.id, true);
    });
  }

  function wireModals() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) {
        closeAllModals();
        return;
      }
      if (e.target.classList.contains('modal')) closeAllModals();
    });
    const faq = $('#faqBtn');
    if (faq) faq.addEventListener('click', function () { openModal($('#faqModal')); });
    const faqM = $('#faqBtnMobile');
    if (faqM) faqM.addEventListener('click', function () { openModal($('#faqModal')); });
    const add = $('#addBtn');
    if (add) add.addEventListener('click', function () { openModal($('#addModal')); });
    const addM = $('#addBtnMobile');
    if (addM) addM.addEventListener('click', function () { openModal($('#addModal')); });
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
    if (hero && canHoverVideo) {
      hero.addEventListener('mouseenter', function () {
        heroHovering = true;
        stopHeroCarousel();
        setHeroVideo(gameById(state.heroId));
      });
      hero.addEventListener('mouseleave', function () {
        heroHovering = false;
        clearHeroVideo();
        startHeroCarousel();
      });
    }
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
      const next = (cur === 'dark' || (!cur && sys)) ? 'light' : 'dark';
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
