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
    try {
      localStorage.setItem('gv_' + key, JSON.stringify(val));
    } catch {}
  }
};

const state = {
  currentId: null,
  search: '',
  type: 'all',
  status: 'all',
  platform: 'all',
  sort: LS.get('sort', 'rating'),
  view: LS.get('view', 'grid'),
  favorites: new Set(LS.get('favorites', [])),
  history: LS.get('history', []),
  ratings: LS.get('ratings', {}),
  votes: LS.get('votes', {}),
  broken: new Set(LS.get('broken', []))
};

const esc = s =>
  String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c])
  );

function on(el, ev, fn, opts) {
  if (el) el.addEventListener(ev, fn, opts);
}

function trKey(gameId, tr) {
  return gameId + '::' + tr.name;
}

function ratingOf(gameId, tr) {
  const user = state.ratings[trKey(gameId, tr)];
  const base = tr.rating || 0;
  if (!base && !user) return null;
  if (!user) return base;
  if (!base) return user;
  return Math.round(((base * 8 + user) / 9) * 10) / 10;
}

function stars(value, interactive = false, dataset = '') {
  if (value == null) return `<span class="stars-empty">оценок нет</span>`;
  const full = Math.round(value);
  let html = `<span class="stars" ${dataset}>`;
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= full ? 'on' : ''}" ${interactive ? `data-star="${i}"` : ''}>★</span>`;
  }
  html += `</span><span class="stars-val">${value.toFixed(1)}</span>`;
  return html;
}

function typeLabel(t) {
  return TYPE_LABELS[t] || t;
}
function statusLabel(s) {
  return STATUS_LABELS[s] || s;
}

function gameRating(g) {
  const rs = g.translations.map(t => ratingOf(g.id, t)).filter(Boolean);
  if (!rs.length) return null;
  return Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10;
}

function countLabel(g) {
  const n = g.translations.length;
  return n === 1 ? '1 вариант' : n < 5 ? n + ' варианта' : n + ' вариантов';
