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
    sec.style.display
