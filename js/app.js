(function () {
  'use strict';

  const REPO = 'Stintik-123/GameVoice';

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get: function (key, fallback) {
      try {
        const v = JSON.parse(localStorage.getItem(key));
        return v == null ? fallback : v;
      } catch (e) {
        return fallback;
      }
    },
    set: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
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
    for (let i = 0; i < games.length; i++) {
      if (games[i].id === id) return games[i];
    }
    return null;
  }

  function matchesQuery(g, q) {
    if (!q) return true;
    const hay = translit(
      [g.title, g.subtitle || '', g.developer || '', g.genre || ''].concat(g.tags || []).join(' ')
    );
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
    return sortGames(games.filter(function (g) {
      return matchesQuery(g, state.query) && matchesFilters(g);
    }));
  }

  function renderCatalog() {
    const list = getFiltered();
    const wrap = $('#carousel');
    const count = $('#resultsCount');
    if (count) count.textContent = 'найдено: ' + list.length + ' из ' + games.length;
    if (wrap) {
      wrap.innerHTML = list.length === 0
        ? GV.emptyHTML('Ничего не найдено — попробуйте сбросить фильтры')
        : list.map(function (g) { return GV.cardHTML(g, state.favorites.has(g.id)); }).join('');
    }
    const catalogWrap = $('#catalogWrap');
    if (catalogWrap) catalogWrap.dataset.view = state.view;
  }

  function renderFavorites() {
    const list = games.filter(function (g) { return state.favorites.has(g.id); });
    const counter = $('#favCount');
    if (counter) counter.textContent = String(list.length);
    const mirror = $('[data-favcount-mirror]');
    if (mirror) mirror.textContent = String(list.length);
    const section = $('#favoritesSection');
    const grid = $('#favoritesGrid');
    if (!section || !grid) return;
    if (list.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    grid.innerHTML = list.map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderHistory() {
    const list = state.history.map(function (id) { return gameById(id); }).filter(Boolean);
    const section = $('#historySection');
    const grid = $('#historyGrid');
    if (!section || !grid) return;
    if (list.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    grid.innerHTML = list.map(function (g) { return GV.miniCardHTML(g); }).join('');
  }

  function renderStats() {
    const row = $('#statsRow');
    if (row) row.innerHTML = GV.statsHTML();
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
      const platforms = (g.platforms || []).join(', ').toUpperCase();
      meta.textContent = g.genre + ' · ' + g.year + ' · ' + GV.translationCount(g) +
        ' вариантов' + (platforms ? ' · ' + platforms : '');
    }
    if (tags) {
      tags.innerHTML = (g.tags || []).map(function (t) { return '<span>#' + t + '</span>'; }).join('');
    }
    if (bg) bg.style.cssText = GV.coverStyle(g);
    if (favBtn) {
      const isFav = state.favorites.has(g.id);
      favBtn.setAttribute('aria-pressed', String(isFav));
      favBtn.textContent = isFav ? '★ В избранном' : '☆ В избранное';
    }
    if (dots) {
      dots.innerHTML = games.map(function (gg) {
        return '<button type="button" role="tab" aria-selected="' + (gg.id === g.id) +
          '" aria-label="' + gg.title + '"></button>';
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
    const titleEl = $('#detailsTitle');
    const listEl = $('#translationsList');
    if (titleEl) titleEl.textContent = 'Варианты локализации — ' + g.title;
    if (listEl) {
      listEl.innerHTML = g.translations.map(function (t, i) {
        const key = g.id + ':' + i;
        return GV.translationHTML(g, t, i, state.userRatings[key] || 0);
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
    if (location.hash !== '#' + g.id) {
      history.replaceState(null, '', '#' + g.id);
    }
    renderHero(g);
    if (scroll) {
      const details = $('#details');
      if (details) details.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
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

  function openModal(modal) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.classList.add('open');
    const focusable = modal.querySelector('button, input, select, textarea, a[href]');
    const target = focusable || modal;
    if (target && target.focus) target.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    if (modal.id === 'trailerModal') {
      const frame = $('#videoFrame');
      if (frame) frame.innerHTML = '';
    }
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function closeAllModals() {
    $$('.modal.open').forEach(function (m) { closeModal(m); });
  }

  function openTrailer(g) {
    if (!g || !g.trailerId) return;
    const modal = $('#trailerModal');
    const title = $('#trailerTitle');
    const tabs = $('#videoTabs');
    const frame = $('#videoFrame');
    if (!modal || !tabs || !frame) return;
    if (title) title.textContent = 'Трейлер — ' + g.title;
    const all = [{ id: g.trailerId, label: 'Основной' }].concat(g.extraTrailers || []);
    tabs.innerHTML = all.map(function (t, i) {
      return '<button type="button" data-id="' + t.id + '" class="' + (i === 0 ? 'active' : '') + '">' +
        t.label + '</button>';
    }).join('');
    const setFrame = function (id) {
      frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&rel=0" title="Трейлер ' + g.title +
        '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    };
    setFrame(all[0].id);
    $$('#videoTabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#videoTabs button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        setFrame(btn.dataset.id);
      });
    });
    openModal(modal);
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
    const platforms = Array.from(new Set(games.reduce(function (acc, g) {
      return acc.concat(g.platforms || []);
    }, []))).sort();
    const genreSel = $('#filterGenre');
    const statusSel = $('#filterStatus');
    const platformSel = $('#filterPlatform');
    const sortSel = $('#sortBy');
    if (genreSel) {
      genreSel.innerHTML = '<option value="">Все жанры</option>' + genres.map(function (g) {
        return '<option value="' + g + '">' + g + '</option>';
      }).join('');
    }
    if (statusSel) {
      statusSel.innerHTML = '<option value="">Любой статус</option>' +
        '<option value="done">Готово</option>' +
        '<option value="progress">В работе</option>' +
        '<option value="abandoned">Заброшено</option>';
    }
    if (platformSel) {
      platformSel.innerHTML = '<option value="">Все платформы</option>' + platforms.map(function (p) {
        return '<option value="' + p + '">' + p.toUpperCase() + '</option>';
      }).join('');
    }
    if (sortSel) {
      sortSel.innerHTML =
        '<option value="rating">Сначала рейтинг</option>' +
        '<option value="updated">Сначала обновлённые</option>' +
        '<option value="year">Сначала новые</option>' +
        '<option value="count">Больше вариантов</option>' +
        '<option value="alpha">По алфавиту</option>';
    }
  }

  function wireViewToggle() {
    const buttons = $$('.view-toggle button');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.view = btn.dataset.view;
        store.set('gv_view', state.view);
        buttons.forEach(function (b) { b.classList.toggle('active', b === btn); });
        renderCatalog();
      });
    });
    const current = $('.view-toggle button[data-view="' + state.view + '"]');
    if (current) {
      buttons.forEach(function (b) { b.classList.remove('active'); });
      current.classList.add('active');
    }
  }

  function wireChips() {
    $$('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const on = !chip.classList.contains('active');
        $$('.chip').forEach(function (c) { c.classList.remove('active'); });
        if (on) chip.classList.add('active');
        state.filters.chip = on ? chip.dataset.chip : null;
        renderCatalog();
      });
    });
  }

  function wireSelects() {
    const genreSel = $('#filterGenre');
    const statusSel = $('#filterStatus');
    const platformSel = $('#filterPlatform');
    const sortSel = $('#sortBy');
    if (genreSel) genreSel.addEventListener('change', function (e) { state.filters.genre = e.target.value; renderCatalog(); });
    if (statusSel) statusSel.addEventListener('change', function (e) { state.filters.status = e.target.value; renderCatalog(); });
    if (platformSel) platformSel.addEventListener('change', function (e) { state.filters.platform = e.target.value; renderCatalog(); });
    if (sortSel) sortSel.addEventListener('change', function (e) { state.filters.sort = e.target.value; renderCatalog(); });
  }

  function wireReset() {
    const btn = $('#resetFilters');
    if (!btn) return;
    btn.addEventListener('click', function () {
      state.filters = { chip: null, genre: '', status: '', platform: '', sort: 'rating' };
      state.query = '';
      const searchInput = $('#searchInput');
      const clearBtn = $('#searchClear');
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.hidden = true;
      $$('.chip').forEach(function (c) { c.classList.remove('active'); });
      $$('.selects select').forEach(function (s) { s.value = ''; });
      const sortSel = $('#sortBy');
      if (sortSel) sortSel.value = 'rating';
      renderCatalog();
    });
  }

  function wireSearch() {
    const input = $('#searchInput');
    const clearBtn = $('#searchClear');
    if (!input) return;
    let timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      if (clearBtn) clearBtn.hidden = !input.value;
      timer = setTimeout(function () {
        state.query = input.value.trim();
        renderCatalog();
      }, 120);
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        state.query = '';
        clearBtn.hidden = true;
        renderCatalog();
        input.focus();
      });
    }
  }

  function wireCardActions() {
    document.addEventListener('click', function (e) {
      const favBtn = e.target.closest('[data-fav]');
      if (favBtn) {
        e.stopPropagation();
        toggleFavorite(favBtn.dataset.fav);
        return;
      }
      const mini = e.target.closest('.mini-card');
      if (mini) {
        openDetails(mini.dataset.id, true);
        return;
      }
      const card = e.target.closest('.game-card');
      if (card) openDetails(card.dataset.id, true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('game-card')) {
        openDetails(e.target.dataset.id, true);
      }
    });
  }

  function wireModals() {
    $$('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(btn.closest('.modal')); });
    });
    $$('.modal').forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal(modal);
      });
    });
    const pairs = [
      ['#addBtnHeader', '#addModal'],
      ['#addBtnMobile', '#addModal'],
      ['#faqBtnHeader', '#faqModal'],
      ['#faqBtnMobile', '#faqModal']
    ];
    pairs.forEach(function (pair) {
      const btn = $(pair[0]);
      const modal = $(pair[1]);
      if (btn && modal) {
        btn.addEventListener('click', function () { openModal(modal); });
      }
    });
  }

  function wireAddForm() {
    const form = $('#addForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(form);
      const draft = {};
      fd.forEach(function (v, k) { draft[k] = v; });
      const title = encodeURIComponent('[Предложение] ' + (draft.title || 'Новая игра'));
      const body = encodeURIComponent(
        '**Игра:** ' + (draft.title || '') + '\n' +
        '**Тип:** ' + (draft.type || '') + '\n' +
        '**Автор/студия:** ' + (draft.author || '—') + '\n' +
        '**Ссылка:** ' + (draft.url || '—') + '\n\n' +
        (draft.comment || '')
      );
      window.open('https://github.com/' + REPO + '/issues/new?title=' + title + '&body=' + body, '_blank', 'noopener');
      form.reset();
      closeModal($('#addModal'));
      showToast('Открыто окно создания issue на GitHub');
    });
  }

  function wireHeroButtons() {
    const trailerBtn = $('#heroTrailerBtn');
    const gotoBtn = $('#gotoDetailsBtn');
    const favBtn = $('#favBtn');
    if (trailerBtn) trailerBtn.addEventListener('click', function () {
      const g = gameById(state.heroId);
      if (g) openTrailer(g);
    });
    if (gotoBtn) gotoBtn.addEventListener('click', function () {
      if (state.heroId) openDetails(state.heroId, true);
    });
    if (favBtn) favBtn.addEventListener('click', function () {
      if (state.heroId) toggleFavorite(state.heroId);
    });
  }

  function wireRandom() {
    const btn = $('#randomBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const g = games[Math.floor(Math.random() * games.length)];
      renderHero(g);
      const hero = $('#hero');
      if (hero) hero.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function updateThemeBtn() {
    const btn = $('#themeBtn');
    if (!btn) return;
    const current = document.documentElement.dataset.theme;
    const isDark = current === 'dark' ||
      (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    btn.textContent = isDark ? '☀' : '🌙';
  }

  function wireTheme() {
    const saved = store.get('gv_theme', null);
    if (saved) document.documentElement.dataset.theme = saved;
    updateThemeBtn();
    const btn = $('#themeBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const cur = document.documentElement.dataset.theme;
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effective = cur || (sysDark ? 'dark' : 'light');
      const next = effective === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      store.set('gv_theme', next);
      updateThemeBtn();
    });
  }

  function wireBurger() {
    const btn = $('#burgerBtn');
    const menu = $('#mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    $$('.mobile-menu a, .mobile-menu button').forEach(function (el) {
      el.addEventListener('click', function () {
        menu.classList.remove('open');
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function wireTabbar() {
    const tabMenu = $('#tabMenuBtn');
    if (tabMenu) {
      tabMenu.addEventListener('click', function () {
        const burger = $('#burgerBtn');
        if (burger) burger.click();
      });
    }
    $$('.tabbar [data-goto]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const target = $(el.dataset.goto);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        $$('.tabbar a, .tabbar button').forEach(function (b) { b.classList.remove('active'); });
        el.classList.add('active');
      });
    });
  }

  function wireToTop() {
    const btn = $('#toTop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.scrollY > 800);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function wireHotkeys() {
    document.addEventListener('keydown', function (e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        const input = $('#searchInput');
        if (input) input.focus();
      } else if (e.key === 'Escape') {
        closeAllModals();
        const menu = $('#mobileMenu');
        if (menu && menu.classList.contains('open')) {
          menu.classList.remove('open');
          menu.hidden = true;
          const burger = $('#burgerBtn');
          if (burger) burger.setAttribute('aria-expanded', 'false');
        }
        const input = $('#searchInput');
        if (input && document.activeElement === input) input.blur();
      }
    });
  }

  function wirePopState() {
    window.addEventListener('hashchange', function () {
      const id = location.hash.replace('#', '');
      if (!id) return;
      const g = gameById(id);
      if (g) openDetails(g.id, false);
    });
  }

  function handleDeepLink() {
    const hash = location.hash.replace('#', '');
    if (!hash) return false;
    const g = gameById(hash);
    if (!g) return false;
    openDetails(g.id, false);
    return true;
  }

  function init() {
    populateFilters();
    renderStats();
    renderFavorites();
    renderHistory();
    renderCatalog();

    wireViewToggle();
    wireChips();
    wireSelects();
    wireReset();
    wireSearch();
    wireCardActions();
    wireModals();
    wireAddForm();
    wireHeroButtons();
    wireRandom();
    wireTheme();
    wireBurger();
    wireTabbar();
    wireToTop();
    wireHotkeys();
    wirePopState();

    if (!handleDeepLink()) {
      renderHero(games[0]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
