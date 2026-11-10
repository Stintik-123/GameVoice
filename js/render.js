/* Чистые функции разметки: карточки, мини-карточки, варианты локализации. */
import { escapeHTML, highlight } from './search.js';

export const STATUS_LABELS = {
  done: 'готово',
  progress: 'в работе',
  abandoned: 'заброшено',
};

export const TYPE_LABELS = {
  text: 'текст',
  voice: 'озвучка',
  both: 'текст + озвучка',
  subtitles: 'субтитры',
  neuro: 'нейро-озвучка',
};

export const PLATFORM_LABELS = {
  steam: 'Steam',
  gog: 'GOG',
  epic: 'Epic Games',
  ps: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Nintendo Switch',
};

export function plural(n, one, few, many) {
  const abs = Math.abs(Number(n) || 0);
  const m10 = abs % 10;
  const m100 = abs % 100;
  if (m10 === 1 && m100 !== 11) return `${abs} ${one}`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${abs} ${few}`;
  return `${abs} ${many}`;
}

export function pluralVariants(n) {
  return plural(n, 'вариант', 'варианта', 'вариантов');
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || '';
}

export function typeLabel(type) {
  return TYPE_LABELS[type] || type || '';
}

export function numPad(n) {
  const s = String(n);
  return s.length < 3 ? '000'.slice(s.length) + s : s;
}

export function initialOf(game) {
  const clean = (game.title || '').replace(/[^A-Za-zА-Яа-я0-9]/g, '');
  return (clean.charAt(0) || '?').toUpperCase();
}

export function coverStyle(game) {
  return game.cover ? `background-image:url(${game.cover});background-size:cover;background-position:center;` : '';
}

export function fullTitle(game) {
  return game.title + (game.subtitle ? ' ' + game.subtitle : '');
}

export function cardHTML(game, isFavorite, index, query) {
  const count = (game.translations || []).length;
  const badges = [];
  if (hasType(game, 'voice')) badges.push('<span class="card-badge voice">озвучка</span>');
  if (hasType(game, 'text')) badges.push('<span class="card-badge text">текст</span>');
  const meta = [game.genre, game.year].filter(Boolean).join(' · ');
  return `<article class="game-card" data-id="${escapeHTML(game.id)}" tabindex="0" role="button" aria-label="${escapeHTML(fullTitle(game))}">
    <button class="game-card-fav${isFavorite ? ' on' : ''}" type="button" data-fav="${escapeHTML(game.id)}" aria-label="В избранное">★</button>
    <div class="game-card-cover${game.cover ? ' has-cover' : ''}" data-letter="${escapeHTML(initialOf(game))}" style="${coverStyle(game)}">
      ${badges.length ? `<div class="card-badges">${badges.join('')}</div>` : ''}
    </div>
    <div class="game-card-body">
      <div class="game-card-num">№ ${numPad((index || 0) + 1)}${meta ? ' · ' + escapeHTML(meta) : ''}</div>
      <div class="game-card-title">${highlight(fullTitle(game), query)}</div>
      <div class="game-card-meta">${pluralVariants(count)}</div>
    </div>
  </article>`;
}

export function miniCardHTML(game) {
  return `<button class="mini-card" type="button" data-id="${escapeHTML(game.id)}">
    <span class="mini-cover${game.cover ? ' has-cover' : ''}" style="${coverStyle(game)}">${game.cover ? '' : escapeHTML(initialOf(game))}</span>
    <span class="mini-title">${escapeHTML(game.title)}</span>
  </button>`;
}

export function translationHTML(t) {
  return `<article class="translation-card">
    <div class="t-head">
      <div class="t-name">${escapeHTML(t.name || '')}</div>
    </div>
    <div class="t-badges">
      <span>${escapeHTML(t.author || '')}</span>
      <span class="status-${escapeHTML(t.status)}">${escapeHTML(statusLabel(t.status))}</span>
      <span class="type-badge">${escapeHTML(typeLabel(t.type))}</span>
      ${t.version ? `<span>${escapeHTML(t.version)}</span>` : ''}
      ${t.updated ? `<span>${escapeHTML(t.updated)}</span>` : ''}
    </div>
    <div class="t-body">${t.body || ''}</div>
    <div class="t-links">${t.links || ''}</div>
  </article>`;
}

export function statsHTML(counts) {
  return [
    ['игр в каталоге', counts.total],
    ['с озвучкой', counts.voice],
    ['официальных переводов', counts.official],
    ['готовых вариантов', counts.done],
  ]
    .map(([label, value]) => `<div class="stat"><span class="stat-num">${value}</span><span class="stat-label">${label}</span></div>`)
    .join('');
}

export function hasType(game, type) {
  return (game.translations || []).some((t) => {
    if (type === 'voice') return t.type === 'voice' || t.type === 'both';
    if (type === 'text') return t.type === 'text' || t.type === 'both';
    return t.type === type;
  });
}
