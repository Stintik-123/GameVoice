/* ============================================================
   GameVoice — логика приложения
   Каталог: поиск, фильтры, сортировка, сетка/список/лента,
   избранное, история, рейтинг, модалки, хоткеи.
   ============================================================ */

(() => {
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const LS = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem('gv_' + key));
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    try { localStorage.setItem('gv_' + key, JSON.stringify(val)); } catch {}
  }
};

const state = {
  query: '',
  type: 'all',
  status: 'all',
  platform: 'all',
  sort: 'rating',
  view: 'grid',
  currentId: null,
  favorites: LS.get('favorites', []),
  history: LS.get('history', []),
  ratings: LS.get('ratings', {}),
  votes: LS.get('votes', {}),
  theme: LS.get('theme', null),
  drafts: LS.get('drafts', [])
};

const games = typeof GAMES !== 'undefined' ? GAMES : [];
const trailers = typeof TRAILERS !== 'undefined' ? TRAILERS : {};

function gameById(id) {
  return games.find(g => g.id === id) || null;
}

function gameFromHash() {
  const h = (location.hash || '').replace(/^#/, '').toLowerCase();
  if (!h) return null;
  return games.find(g => g.id === h || (g.slug && g.slug === h)) || null;
}

function matchesFilters(g) {
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = [g.title, g.studio, g.genre, ...(g.tags || []), ...(g.variants || []).map(v => [v.author, v.type, v.note].join(' '))].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (state.type !== 'all') {
    const has = (g.variants || []).some(v => (v.type || '').toLowerCase().includes(state.type.toLowerCase()));
    if (!has) return false;
  }
  if (state.status !== 'all') {
    const st = (g.status || '').toLowerCase();
    if (state.status === 'ready' && !['готово', 'complete', 'ready', 'готово'].some(s => st.includes(s))) return false;
    if (state.status === 'wip' && !['в работе', 'wip', 'beta', 'partial'].some(s => st.includes(s))) return false;
  }
  if (state.platform !== 'all') {
    const plats = (g.platforms || []).map(p => p.toLowerCase());
    if (!plats.some(p => p.includes(state.platform.toLowerCase()))) return false;
  }
  return true;
}

function sortGames(list) {
  const arr = [...list];
  const hasActiveFilter = state.query || state.type !== 'all' || state.status !== 'all' || state.platform !== 'all';
  arr.sort((a, b) => {
    if (!hasActiveFilter) {
      const af = state.favorites.includes(a.id) ? 1 : 0;
      const bf = state.favorites.includes(b.id) ? 1 : 0;
      if (bf !== af) return bf - af;
    }
    switch (state.sort) {
      case 'year': return (b.year || 0) - (a.year || 0);
      case 'variants': return ((b.variants || []).length) - ((a.variants || []).length);
      case 'title': return (a.title || '').localeCompare(b.title || '', 'ru');
      case 'updated': return (b.updated || b.year || 0) - (a.updated || a.year || 0);
      case 'rating':
      default:
        return (b.rating || 0) - (a.rating || 0) || (b.votes || 0) - (a.votes || 0);
    }
  });
  return arr;
}

function filteredGames() {
  return sortGames(games.filter(matchesFilters));
}

function isNew(g) {
  if (!g.updated) return false;
  const d = new Date(g.updated);
  if (isNaN(d)) return false;
  const days = (Date.now() - d.getTime()) / 86400000;
  return days <= 45;
}

function cardHTML(g) {
  const fav = state.favorites.includes(g.id);
  const neu = isNew(g);
  const meta = [g.year, g.studio, (g.variants || []).length + ' вар.'].filter(Boolean).join(' · ');
  return `<article class="game-card" data-id="${g.id}" tabindex="0" role="button">
    <div class="game-card-cover" style="background-image:url('${g.cover || ''}')"></div>
    <div class="game-card-body">
      <h3 class="game-card-title">${g.title || ''}</h3>
      <span class="game-card-meta">${meta}</span>
      <div class="game-card-badges">
        ${fav ? '<span class="badge-fav">★</span>' : ''}
        ${neu ? '<span class="badge-new">Новинка</span>' : ''}
        <span class="badge-status">${g.status || ''}</span>
      </div>
    </div>
  </article>`;
}

function applyViewClass() {
  const wrap = $('#catalogWrap');
  if (!wrap) return;
  wrap.classList.remove('catalog-grid', 'catalog-list', 'catalog-carousel');
  wrap.classList.add('catalog-' + state.view);
  const nav = document.querySelector('.carousel-nav');
  if (nav) nav.hidden = state.view !== 'carousel';
}
