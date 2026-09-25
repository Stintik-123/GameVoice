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
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
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
}

/** Самая свежая дата обновления среди переводов игры (YYYY-MM). */
function latestUpdated(g) {
  let best = '';
  for (const t of g.translations) {
    if (t.updated && t.updated > best) best = t.updated;
  }
  return best;
}

/** Обновление за последний месяц → плашка «Новинка». */
function isNewGame(g) {
  const u = latestUpdated(g);
  if (!u) return false;
  const [y, m] = u.split('-').map(Number);
  if (!y || !m) return false;
  const now = new Date();
  const then = new Date(y, m - 1, 1);
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth());
  return months <= 1;
}

function hasActiveFilters() {
  return (
    state.search.trim() !== '' ||
    state.type !== 'all' ||
    state.status !== 'all' ||
    state.platform !== 'all'
  );
}

/** Минимальный транслит RU↔LAT для поиска. */
function translit(s) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };
  return s.replace(/[а-яё]/g, c => map[c] || c);
}

function filteredGames() {
  const q = state.search.toLowerCase().trim();
  const qLat = translit(q);
  let list = games.filter(g => {
    if (q) {
      const authors = g.translations
        .map(t => (t.author || '') + ' ' + (t.name || ''))
        .join(' ');
      const hay = (
        g.title +
        ' ' +
        (g.subtitle || '') +
        ' ' +
        g.desc +
        ' ' +
        g.genre +
        ' ' +
        g.developer +
        ' ' +
        g.tags.join(' ') +
        ' ' +
        authors
      ).toLowerCase();
      const hayLat = translit(hay);
      if (!hay.includes(q) && !hayLat.includes(qLat) && !hay.includes(qLat) && !hayLat.includes(q))
        return false;
    }
    if (state.type !== 'all' && !g.translations.some(t => t.type === state.type)) return false;
    if (state.status !== 'all' && !g.translations.some(t => t.status === state.status)) return false;
    if (state.platform !== 'all' && !g.platforms.includes(state.platform)) return false;
    return true;
  });

  const byTitle = (a, b) => a.title.localeCompare(b.title, 'ru');
  switch (state.sort) {
    case 'year-desc':
      list = [...list].sort((a, b) => b.year - a.year || byTitle(a, b));
      break;
    case 'year-asc':
      list = [...list].sort((a, b) => a.year - b.year || byTitle(a, b));
      break;
    case 'count':
      list = [...list].sort(
        (a, b) => b.translations.length - a.translations.length || byTitle(a, b)
      );
      break;
    case 'title':
      list = [...list].sort(byTitle);
      break;
    case 'updated':
      list = [...list].sort((a, b) => {
        const ua = latestUpdated(a) || '';
        const ub = latestUpdated(b) || '';
        if (ub !== ua) return ub.localeCompare(ua);
        return byTitle(a, b);
      });
      break;
    case 'rating':
    default: {
      list = [...list].sort((a, b) => {
        const ra = gameRating(a) ?? -1,
          rb = gameRating(b) ?? -1;
        if (rb !== ra) return rb - ra;
        return byTitle(a, b);
      });
      break;
    }
  }

  // Избранное сверху только без активных фильтров
  if (!hasActiveFilters() && state.favorites.size) {
    list = [
      ...list.filter(g => state.favorites.has(g.id)),
      ...list.filter(g => !state.favorites.has(g.id))
    ];
  }
  return list;
}

let autoRotate = true;
let rotateTimer = null;
const ytThumb = vid => `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

function selectGame(id, fromUser = true) {
  const game = games.find(g => g.id === id);
  if (!game) return;
  state.currentId = id;
  if (fromUser) stopRotation();
  if (fromUser || location.hash.slice(1) !== id) {
    try {
      history.replaceState(null, '', '#' + id);
    } catch {}
  }
  state.history = [id, ...state.history.filter(h => h !== id)].slice(0, 6);
  LS.set('history', state.history);
  renderHistory();

  const bg = $('#heroBg');
  if (bg) bg.className = 'hero-bg ' + game.coverClass;

  const poster = $('#heroPoster');
  if (poster) {
    poster.classList.remove('loaded');
    if (game.trailerId) {
      const img = new Image();
      img.onload = () => {
        poster.style.backgroundImage = `url("${ytThumb(game.trailerId)}")`;
        poster.classList.add('loaded');
      };
      img.src = ytThumb(game.trailerId);
    } else {
      poster.style.backgroundImage = '';
    }
  }

  window.__gvCurrentTrailer = game.trailerId || null;
  if (typeof window.setHeroBackgroundVideo === 'function') {
    window.setHeroBackgroundVideo(game.trailerId || null);
  }

  const setText = (sel, text) => {
    const el = $(sel);
    if (el) el.textContent = text;
  };
  setText('#heroBadge', state.favorites.has(id) ? '★ В избранном' : 'В каталоге · ' + game.developer);
  setText('#heroTitle', game.title + (game.subtitle ? ' ' + game.subtitle : ''));
  setText('#heroDesc', game.desc);

  const r = gameRating(game);
  const meta = $('#heroMeta');
  if (meta)
    meta.innerHTML = `
    <span class="meta-item">${esc(game.genre)}</span><span class="meta-dot">·</span>
    <span class="meta-item">${game.year}</span><span class="meta-dot">·</span>
    <span class="meta-item">${countLabel(game)}</span><span class="meta-dot">·</span>
    <span class="meta-item meta-platforms">${game.platforms
      .slice(0, 4)
      .map(p => PLATFORM_LABELS[p] || p)
      .join(', ')}</span>
    ${r ? `<span class="meta-dot">·</span><span class="meta-item meta-rating">★ ${r.toFixed(1)}</span>` : ''}
  `;

  const tags = $('#heroTags');
  if (tags) tags.innerHTML = game.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('');
  const isFav = state.favorites.has(id);
  const favBtn = $('#favBtn');
  if (favBtn) {
    favBtn.classList.toggle('active', isFav);
    favBtn.setAttribute('aria-pressed', isFav);
    favBtn.textContent = isFav ? '★ В избранном' : '☆ В избранное';
  }
  const trBtn = $('#heroTrailerBtn');
  if (trBtn) trBtn.style.display = game.trailerId ? '' : 'none';

  $$('.game-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
  const activeCard = $(`.game-card[data-id="${id}"]`);
  if (activeCard && fromUser)
    activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  renderHeroDots();
  renderDetails(game);
}

function renderHeroDots() {
  const el = $('#heroDots');
  if (!el) return;
  el.innerHTML = games
    .map(
      g =>
        `<button class="hero-dot ${g.id === state.currentId ? 'on' : ''}" data-dot="${g.id}" role="tab" aria-label="${esc(g.title)}" title="${esc(g.title)}"></button>`
    )
    .join('');
}

function gameTrailers(game) {
  const arr = [];
  if (game.trailerId) arr.push({ id: game.trailerId, label: 'Официальный трейлер' });
  (game.extraTrailers || []).forEach(t => arr.push(t));
  return arr;
}

function renderTrailerStrip(game) {
  const strip = $('#trailerStrip');
  if (!strip) return;
  const vids = gameTrailers(game);
  if (!vids.length) {
    strip.innerHTML = '';
    return;
  }
  strip.innerHTML = `
    <div class="strip-head">
      <h3>▶ Трейлеры</h3>
      <span class="strip-hint">нажмите, чтобы посмотреть прямо на сайте</span>
    </div>
    <div class="strip-row">
      ${vids
        .map(
          v => `
        <button class="strip-item" data-trailer="${v.id}" data-label="${esc(v.label)}" aria-label="${esc(game.title)} — ${esc(v.label)}">
          <img src="${ytThumb(v.id)}" alt="" loading="lazy">
          <span class="strip-play">▶</span>
          <span class="strip-cap">${esc(v.label)}</span>
        </button>`
        )
        .join('')}
    </div>`;
}

function renderDetails(game) {
  const dt = $('#detailsTitle');
  if (dt) dt.textContent = `Варианты локализации — ${game.title}`;
  renderTrailerStrip(game);
  const list = $('#translationsList');
  if (!list) return;
  list.innerHTML = game.translations
    .map((tr, i) => {
      const rv = ratingOf(game.id, tr);
      const isBroken = state.broken.has(game.id + '::' + i);
      return `
    <article class="translation" data-tr="${i}">
      <div class="tr-top">
        <span class="tr-type ${tr.type}">${typeLabel(tr.type)}</span>
        <span class="tr-status ${tr.status}"><i class="dot"></i>${statusLabel(tr.status)}</span>
        <span class="tr-name">${esc(tr.name)}</span>
        ${tr.version && tr.version !== '—' ? `<span class="tr-ver">v${esc(tr.version)}</span>` : ''}
        <span class="tr-rating">${stars(rv, true, `data-trname="${esc(tr.name)}"`)} </span>
      </div>
      <div class="tr-meta-line">
        <span>Автор: <strong>${esc(tr.author || '—')}</strong></span>
        ${tr.updated ? `<span>Обновлён: <strong>${esc(tr.updated)}</strong></span>` : ''}
      </div>
      <div class="tr-body">${tr.body}</div>
      <div class="tr-links">
        ${tr.links}
        <button class="btn btn-warn report-btn" data-report="${i}">⚑ Ссылка не работает</button>
      </div>
      ${isBroken ? `<p class="broken-note">Сообщение: сообщество отметило ссылку как нерабочую — проверьте актуальность на странице проекта.</p>` : ''}
      ${tr.install || ''}
    </article>`;
    })
    .join('');

  const v = state.votes[game.id] || { up: 0, down: 0 };
  const vb = $('#voteBox');
  if (vb)
    vb.innerHTML = `
    <span class="vote-q">Полезен ли раздел для этой игры?</span>
    <button class="vote-btn up ${v.mine === 'up' ? 'mine' : ''}" data-vote="up" aria-pressed="${v.mine === 'up'}">👍 ${v.up || 0}</button>
    <button class="vote-btn down ${v.mine === 'down' ? 'mine' : ''}" data-vote="down" aria-pressed="${v.mine === 'down'}">👎 ${v.down || 0}</button>
    <button class="vote-btn share" id="shareGameBtn" title="Скопировать ссылку на игру">↗ Поделиться</button>
  `;
}

function cardHTML(g) {
  const r = gameRating(g);
  const fav = state.favorites.has(g.id);
  const neu = isNewGame(g);
  return `
  <div class="game-card ${g.id === state.currentId ? 'active' : ''}" data-id="${g.id}" tabindex="0" role="button" aria-label="${esc(g.title)}">
    <div class="game-card-cover ${g.coverClass}" data-letter="${esc(g.title.charAt(0))}">
      <button class="fav-star ${fav ? 'on' : ''}" data-fav="${g.id}" title="В избранное" aria-label="В избранное">${fav ? '★' : '☆'}</button>
      ${neu ? `<span class="badge-new">Новинка</span>` : ''}
      ${r ? `<span class="card-rating">★ ${r.toFixed(1)}</span>` : ''}
      <div class="game-card-title">
        ${esc(g.title)}
        <span class="game-card-count">${countLabel(g)} · ${g.year}</span>
      </div>
    </div>
  </div>`;
}

/** Применяет класс вида к #catalogWrap, не затирая id и прочие классы. */
function applyViewClass() {
  const wrap = $('#catalogWrap');
  if (!wrap) return;
  wrap.classList.remove('catalog-grid', 'catalog-list', 'catalog-carousel');
  wrap.classList.add('catalog-' + state.view);
  const nav = document.querySelector('.carousel-nav');
  if (nav) nav.hidden = state.view !== 'carousel';
}

function renderCatalog() {
  const list = filteredGames();
  applyViewClass();
  const car = $('#carousel');
  if (car)
    car.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : `<div class="empty-state">
         <div class="empty-emoji">🔍</div>
         <p>Ничего не найдено. Попробуйте изменить запрос или сбросить фильтры.</p>
         <button class="btn btn-accent" id="resetFilters2">Сбросить всё</button>
       </div>`;
  const rc = $('#resultsCount');
  if (rc) rc.textContent = list.length ? `Найдено: ${list.length} из ${games.length}` : '';
  bindCards();
}

function bindCards() {
  $$('.game-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('[data-fav]')) return;
      selectGame(card.dataset.id);
      $('#details')?.scrollIntoView({ behavior: 'smooth' });
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
  $$('[data-fav]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.fav);
    });
  });
  on($('#resetFilters2'), 'click', resetFilters);
}

function updateFavCounts() {
  const n = state.favorites.size;
  const fc = $('#favCount');
  if (fc) fc.textContent = n;
  $$('[data-favcount-mirror]').forEach(el => {
    el.textContent = n;
  });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  LS.set('favorites', [...state.favorites]);
  renderCatalog();
  renderFavorites();
  if (state.currentId === id) selectGame(id, false);
}

function fillSelect(sel, labels, current) {
  sel.innerHTML = Object.entries(labels)
    .map(
      ([k, v]) =>
        `<option value="${k}" ${k === current ? 'selected' : ''}>${v}</option>`
    )
    .join('');
}

function applyFiltersUI() {
  const ft = $('#filterType'),
    fs = $('#filterStatus'),
    fp = $('#filterPlatform'),
    sb = $('#sortBy');
  if (ft) fillSelect(ft, TYPE_LABELS, state.type);
  if (fs) fillSelect(fs, STATUS_LABELS, state.status);
  if (fp) fillSelect(fp, PLATFORM_LABELS, state.platform);
  if (sb)
    fillSelect(
      sb,
      {
        rating: 'По рейтингу',
        updated: 'По дате обновления',
        'year-desc': 'Сначала новые',
        'year-asc': 'Сначала старые',
        count: 'По числу вариантов',
        title: 'По алфавиту'
      },
      state.sort
    );
  $$('#chips .chip').forEach(ch =>
    ch.classList.toggle('active', ch.dataset.chip === state.type)
  );
}

function resetFilters() {
  state.search = '';
  const si = $('#searchInput');
  if (si) si.value = '';
  state.type = state.status = state.platform = 'all';
  state.sort = 'rating';
  LS.set('sort', state.sort);
  applyFiltersUI();
  renderCatalog();
  toast('Фильтры сброшены');
}

function initChips() {
  on($('#chips'), 'click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.type = state.type === chip.dataset.chip ? 'all' : chip.dataset.chip;
    applyFiltersUI();
    renderCatalog();
  });
}

function miniCard(g) {
  return `<button class="mini-card" data-goto="${g.id}">
    <span class="mini-cover ${g.coverClass}"></span>
    <span class="mini-title">${esc(g.title)}</span>
  </button>`;
}

function renderFavorites() {
  const favs = games.filter(g => state.favorites.has(g.id));
  const sec = $('#favoritesSection');
  if (sec) sec.style.display = favs.length ? '' : 'none';
  const grid = $('#favoritesGrid');
  if (grid) grid.innerHTML = favs.map(miniCard).join('');
  updateFavCounts();
  if (grid) bindMiniCards(grid);
}

function renderHistory() {
  const hist = state.history.map(id => games.find(g => g.id === id)).filter(Boolean);
  const sec = $('#historySection');
  if (sec) sec.style.display = hist.length ? '' : 'none';
  const grid = $('#historyGrid');
  if (grid) {
    grid.innerHTML = hist.map(miniCard).join('');
    bindMiniCards(grid);
  }
}

function bindMiniCards(root) {
  $$('[data-goto]', root).forEach(b =>
    b.addEventListener('click', () => {
      selectGame(b.dataset.goto);
      $('#hero')?.scrollIntoView({ behavior: 'smooth' });
    })
  );
}

function bindStarRating() {
  on($('#translationsList'), 'click', e => {
    const star = e.target.closest('[data-star]');
    if (!star) return;
    const name = star.closest('.stars').dataset.trname;
    const tr = games
      .find(g => g.id === state.currentId)
      ?.translations.find(t => t.name === name);
    if (!tr) return;
    const key = trKey(state.currentId, tr);
    state.ratings[key] =
      state.ratings[key] === Number(star.dataset.star)
        ? undefined
        : Number(star.dataset.star);
    if (state.ratings[key] === undefined) delete state.ratings[key];
    LS.set('ratings', state.ratings);
    renderDetails(games.find(g => g.id === state.currentId));
    renderCatalog();
    toast('Спасибо за оценку!');
  });
}

function bindVotes() {
  on($('#voteBox'), 'click', e => {
    const btn = e.target.closest('[data-vote]');
    if (!btn || !state.currentId) return;
    const v = state.votes[state.currentId] || { up: 0, down: 0 };
    const dir = btn.dataset.vote;
    if (v.mine === dir) {
      v[dir] = Math.max(0, (v[dir] || 0) - 1);
      v.mine = null;
    } else {
      if (v.mine) v[v.mine] = Math.max(0, (v[v.mine] || 0) - 1);
      v[dir] = (v[dir] || 0) + 1;
      v.mine = dir;
    }
    state.votes[state.currentId] = v;
    LS.set('votes', state.votes);
    renderDetails(games.find(g => g.id === state.currentId));
  });
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    } catch (err) {
      reject(err);
    }
  });
}

function bindLinks() {
  on($('#translationsList'), 'click', e => {
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      e.preventDefault();
      const url = copy.dataset.copy;
      if (e.ctrlKey || e.metaKey || e.button === 1) {
        window.open(url, '_blank', 'noopener');
        return;
      }
      copyText(url)
        .then(() => toast('Ссылка скопирована · Ctrl+клик — открыть'))
        .catch(() => toast('Не удалось скопировать'));
      return;
    }
    const rep = e.target.closest('[data-report]');
    if (rep) {
      const key = state.currentId + '::' + rep.dataset.report;
      if (state.broken.has(key)) {
        state.broken.delete(key);
        toast('Отметка снята');
      } else {
        state.broken.add(key);
        toast('Спасибо! Отметили как «проверить ссылку»');
      }
      LS.set('broken', [...state.broken]);
      renderDetails(games.find(g => g.id === state.currentId));
    }
  });
}

function bindShare() {
  on($('#voteBox'), 'click', e => {
    if (!e.target.closest('#shareGameBtn') || !state.currentId) return;
    const url = location.origin + location.pathname + '#' + state.currentId;
    const game = games.find(g => g.id === state.currentId);
    const title = game ? game.title : 'GameVoice';
    if (navigator.share) {
      navigator
        .share({ title: title + ' — GameVoice', url, text: 'Русские локализации: ' + title })
        .catch(() => copyText(url).then(() => toast('Ссылка скопирована')));
    } else {
      copyText(url)
        .then(() => toast('Ссылка на игру скопирована'))
        .catch(() => toast('Не удалось скопировать'));
    }
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = $('#themeBtn');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
  LS.set('theme', theme);
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* —— Модалки с управлением фокусом —— */
let lastFocus = null;

function openModal(id) {
  const el = typeof id === 'string' ? $(id) : id;
  if (!el) return;
  lastFocus = document.activeElement;
  el.classList.add('open');
  document.body.classList.add('no-scroll');
  const focusable = el.querySelector(
    '[data-close], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) {
    requestAnimationFrame(() => focusable.focus());
  }
}

function closeModal(m) {
  if (!m) return;
  m.classList.remove('open');
  if (m.id === 'trailerModal') stopVideo();
  if (!$$('.modal.open').length) {
    document.body.classList.remove('no-scroll');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try {
        lastFocus.focus();
      } catch {}
    }
    lastFocus = null;
  }
}

function initModals() {
  on($('#addBtn'), 'click', () => openModal('#addModal'));
  on($('#faqBtn'), 'click', () => openModal('#faqModal'));
  $$('.modal').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-close]')) closeModal(m);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal.open').forEach(closeModal);
      closeMobileMenu();
    }
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName);

    if (e.key === '?' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const hm = $('#hotkeysModal');
      if (hm) {
        if (hm.classList.contains('open')) closeModal(hm);
        else openModal(hm);
      }
      return;
    }

    if (e.key === '/' && !typing) {
      e.preventDefault();
      const si = $('#searchInput');
      if (si) {
        si.focus();
        si.select();
      }
    }
    if (
      !typing &&
      !$$('.modal.open').length &&
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
    ) {
      const list = filteredGames();
      if (!list.length) return;
      const idx = list.findIndex(g => g.id === state.currentId);
      const next =
        e.key === 'ArrowRight'
          ? list[(idx + 1) % list.length]
          : list[(idx - 1 + list.length) % list.length];
      if (next) {
        e.preventDefault();
        selectGame(next.id);
      }
    }
  });

  on($('#addForm'), 'submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const drafts = LS.get('drafts', []);
    drafts.push({ ...data, date: new Date().toISOString().slice(0, 10) });
    LS.set('drafts', drafts);
    closeModal($('#addModal'));
    e.target.reset();
    toast('Черновик сохранён локально. Спасибо!');
    renderDrafts();
  });
}

function renderDrafts() {
  const drafts = LS.get('drafts', []);
  const note = $('#draftsNote');
  if (!note) return;
  note.style.display = drafts.length ? '' : 'none';
  note.innerHTML =
    `Ваши черновики (${drafts.length}): ` +
    drafts
      .map(
        d =>
          `<span class="draft-pill">${esc(d.title || 'без названия')} · ${esc(d.date)}</span>`
      )
      .join(' ');
}

function startRotation() {
  stopRotation();
  if (!autoRotate) return;
  rotateTimer = setInterval(() => {
    if (document.hidden) return;
    const idx = games.findIndex(g => g.id === state.currentId);
    selectGame(games[(idx + 1) % games.length].id, false);
  }, 9000);
}
function stopRotation() {
  autoRotate = false;
  clearInterval(rotateTimer);
}

function initCarouselNav() {
  on($('#prevBtn'), 'click', () =>
    $('#carousel')?.scrollBy({ left: -280, behavior: 'smooth' })
  );
  on($('#nextBtn'), 'click', () =>
    $('#carousel')?.scrollBy({ left: 280, behavior: 'smooth' })
  );

  // Колёсико: только в режиме «Лента», только когда ленту можно крутить
  let wheelLock = false;
  const car = $('#carousel');
  if (!car) return;
  car.addEventListener(
    'wheel',
    e => {
      if (state.view !== 'carousel') return;
      const overflow = car.scrollWidth > car.clientWidth + 4;
      if (!overflow) return;
      const atStart = car.scrollLeft <= 0;
      const atEnd = car.scrollLeft + car.clientWidth >= car.scrollWidth - 2;
      const dy = e.deltaY || e.deltaX;
      if ((atStart && dy < 0) || (atEnd && dy > 0)) return;
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      car.scrollLeft += dy;
      requestAnimationFrame(() => {
        wheelLock = false;
      });
    },
    { passive: false }
  );
}

function renderStats() {
  const row = $('#statsRow');
  if (!row) return;
  const totalTr = games.reduce((a, g) => a + g.translations.length, 0);
  const done = games.reduce(
    (a, g) => a + g.translations.filter(t => t.status === 'done').length,
    0
  );
  const studios = new Set(games.flatMap(g => g.translations.map(t => t.author))).size;
  row.innerHTML = [
    [games.length, 'игр в каталоге'],
    [totalTr, 'вариантов локализации'],
    [done, 'завершённых переводов'],
    [studios, 'студий и авторов']
  ]
    .map(
      ([n, l]) =>
        `<div class="stat"><span class="stat-num">${n}</span><span class="stat-label">${l}</span></div>`
    )
    .join('');
}

let videoState = { list: [], idx: 0 };

function openTrailerModal(vid, label) {
  const game = games.find(g => g.id === state.currentId);
  if (!game) return;
  const list = gameTrailers(game);
  const at = list.findIndex(v => v.id === vid);
  videoState = { list, idx: at >= 0 ? at : 0 };
  const title = $('#trailerTitle');
  if (title) title.textContent = game.title + (game.subtitle ? ' ' + game.subtitle : '');
  renderVideoTabs(label);
  mountVideo(vid);
  openModal('#trailerModal');
}

function renderVideoTabs(currentLabel) {
  const tabs = $('#videoTabs');
  if (!tabs) return;
  tabs.innerHTML =
    videoState.list.length > 1
      ? videoState.list
          .map(
            v =>
              `<button class="vt ${v.label === currentLabel ? 'on' : ''}" data-vtab="${v.id}" data-vlabel="${esc(v.label)}">${esc(v.label)}</button>`
          )
          .join('')
      : '';
}

function mountVideo(vid) {
  const frame = $('#videoFrame');
  if (!frame) return;
  frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1"
       title="Трейлер" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
       allowfullscreen></iframe>`;
}

function stopVideo() {
  const f = $('#videoFrame');
  if (f) f.innerHTML = '';
}

function bindTrailers() {
  document.addEventListener('click', e => {
    const strip = e.target.closest('[data-trailer]');
    if (strip) {
      openTrailerModal(strip.dataset.trailer, strip.dataset.label);
      return;
    }
    const tab = e.target.closest('[data-vtab]');
    if (tab) {
      videoState.idx = Math.max(
        0,
        videoState.list.findIndex(v => v.id === tab.dataset.vtab)
      );
      renderVideoTabs(tab.dataset.vlabel);
      mountVideo(tab.dataset.vtab);
      return;
    }
    if (e.target.closest('#heroTrailerBtn')) {
      const game = games.find(g => g.id === state.currentId);
      if (game && game.trailerId)
        openTrailerModal(game.trailerId, gameTrailers(game)[0].label);
    }
  });
}

function renderTop10() {
  const list = $('#top10List');
  if (!list) return;
  const top = [...games]
    .map(g => ({
      g,
      r: gameRating(g),
      done: g.translations.filter(t => t.status === 'done').length
    }))
    .filter(x => x.r != null)
    .sort((a, b) => b.r - a.r || b.done - a.done)
    .slice(0, 10);
  list.innerHTML = top
    .map(
      ({ g, r }, i) => `
    <li class="top-item" data-goto="${g.id}" tabindex="0" role="button">
      <span class="top-num">${i + 1}</span>
      <span class="mini-cover ${g.coverClass}"></span>
      <span class="top-info">
        <span class="top-title">${esc(g.title)}</span>
        <span class="top-sub">${esc(g.developer)} · ${countLabel(g)} · завершено: ${g.translations.filter(t => t.status === 'done').length}</span>
      </span>
      <span class="top-rating">★ ${r.toFixed(1)}</span>
    </li>`
    )
    .join('');
  $$('#top10List [data-goto]').forEach(el => {
    el.addEventListener('click', () => {
      selectGame(el.dataset.goto);
      $('#details')?.scrollIntoView({ behavior: 'smooth' });
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') el.click();
    });
  });
}

const MONTHS = {
  '01': 'янв', '02': 'фев', '03': 'мар', '04': 'апр', '05': 'май', '06': 'июн',
  '07': 'июл', '08': 'авг', '09': 'сен', '10': 'окт', '11': 'ноя', '12': 'дек'
};

function newsItems() {
  const items = [];
  games.forEach(g =>
    g.translations.forEach(tr => {
      if (!tr.updated) return;
      const kind =
        tr.status === 'done'
          ? '🎉 релиз'
          : tr.status === 'progress'
            ? '🔨 в работе'
            : '💤 заброшен';
      items.push({
        date: tr.updated,
        sort: tr.updated.replace('-', ''),
        game: g,
        tr,
        kind
      });
    })
  );
  return items.sort((a, b) => b.sort.localeCompare(a.sort)).slice(0, 9);
}

function renderNews() {
  const grid = $('#newsGrid');
  if (!grid) return;
  grid.innerHTML = newsItems()
    .map(
      n => `
    <button class="news-card" data-goto="${n.game.id}">
      <div class="news-top">
        <span class="news-kind ${n.tr.status}">${n.kind}</span>
        <span class="news-date">${MONTHS[n.date.slice(5, 7)] || n.date.slice(5, 7)} ${n.date.slice(0, 4)}</span>
      </div>
      <div class="news-game">${esc(n.game.title)}</div>
      <div class="news-tr">${esc(n.tr.name)}</div>
      <div class="news-author">${esc(n.tr.author || '—')}</div>
    </button>`
    )
    .join('');
  $$('#newsGrid [data-goto]').forEach(el =>
    el.addEventListener('click', () => {
      selectGame(el.dataset.goto);
      $('#details')?.scrollIntoView({ behavior: 'smooth' });
    })
  );
}

function closeMobileMenu() {
  const menu = $('#mobileMenu'),
    burger = $('#burgerBtn');
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  if (burger) {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
}

function initChrome() {
  const burger = $('#burgerBtn'),
    menu = $('#mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = !menu.hidden;
      menu.hidden = open;
      burger.setAttribute('aria-expanded', String(!open));
      burger.classList.toggle('open', !open);
    });
    menu.addEventListener('click', e => {
      if (e.target.closest('a')) closeMobileMenu();
    });
  }
  on($('#faqBtnMobile'), 'click', () => {
    closeMobileMenu();
    openModal('#faqModal');
  });
  on($('#addBtnMobile'), 'click', () => {
    closeMobileMenu();
    openModal('#addModal');
  });
  on($('#faqBtnFooter'), 'click', () => openModal('#faqModal'));
  on($('#footerFaqLink'), 'click', e => {
    e.preventDefault();
    openModal('#faqModal');
  });
  on($('#heroDots'), 'click', e => {
    const dot = e.target.closest('[data-dot]');
    if (dot) selectGame(dot.dataset.dot);
  });
  on($('#gotoDetailsBtn'), 'click', () => {
    $('#details')?.scrollIntoView({ behavior: 'smooth' });
  });
  const toTop = $('#toTop');
  if (toTop) {
    window.addEventListener(
      'scroll',
      () => toTop.classList.toggle('show', window.scrollY > 500),
      { passive: true }
    );
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }
}

function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

const _origRenderCatalog = renderCatalog;
renderCatalog = function () {
  _origRenderCatalog();
  renderTop10();
};

function gameFromHash() {
  const id = location.hash.replace(/^#/, '').trim();
  if (!id) return null;
  return games.find(g => g.id === id) || null;
}

function init() {
  if (typeof games === 'undefined' || !games.length) {
    console.error('GameVoice: data.js не загружен или пуст');
    return;
  }
  applyTheme(LS.get('theme', 'light'));

  on(
    $('#searchInput'),
    'input',
    debounce(e => {
      state.search = e.target.value;
      renderCatalog();
    }, 150)
  );

  on($('#filterType'), 'change', e => {
    state.type = e.target.value;
    applyFiltersUI();
    renderCatalog();
  });
  on($('#filterStatus'), 'change', e => {
    state.status = e.target.value;
    renderCatalog();
  });
  on($('#filterPlatform'), 'change', e => {
    state.platform = e.target.value;
    renderCatalog();
  });
  on($('#sortBy'), 'change', e => {
    state.sort = e.target.value;
    LS.set('sort', state.sort);
    renderCatalog();
  });
  on($('#resetFilters'), 'click', resetFilters);

  $$('.view-toggle button').forEach(b =>
    b.addEventListener('click', () => {
      state.view = b.dataset.view;
      LS.set('view', state.view);
      $$('.view-toggle button').forEach(x =>
        x.classList.toggle('active', x === b)
      );
      applyViewClass();
      renderCatalog();
    })
  );
  $$('.view-toggle button').forEach(x =>
    x.classList.toggle('active', x.dataset.view === state.view)
  );

  on($('#themeBtn'), 'click', () => {
    applyTheme(
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    );
  });

  on($('#favBtn'), 'click', () => state.currentId && toggleFavorite(state.currentId));

  initChips();
  initCarouselNav();
  initModals();
  initChrome();
  bindTrailers();
  bindStarRating();
  bindVotes();
  bindLinks();
  bindShare();
  renderDrafts();
  renderStats();
  renderTop10();
  renderNews();

  applyFiltersUI();
  applyViewClass();
  renderCatalog();
  renderFavorites();

  const fromHash = gameFromHash();
  if (fromHash) {
    selectGame(fromHash.id, false);
    requestAnimationFrame(() => {
      if (location.hash) $('#details')?.scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    selectGame(games[0].id, false);
    startRotation();
  }

  window.addEventListener('hashchange', () => {
    const g = gameFromHash();
    if (g && g.id !== state.currentId) selectGame(g.id, false);
  });

  on($('#hero'), 'pointerenter', stopRotation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
