/* GameVoice — точка входа.
   Собирает модули (каталог, состояние, роутер, рендер) и связывает их с DOM. */

import { GAMES } from './data.js';
import { applyCovers } from './steam-covers.js';
import { state, saveFilters, toggleFavorite, pushHistory, read, write } from './store.js';
import { createCatalog } from './catalog.js';
import { createRouter } from './router.js';
import { cardHTML, miniCardHTML, translationHTML, statsHTML, fullTitle, coverStyle, pluralVariants } from './render.js';
import { escapeHTML } from './search.js';
import { setHeroVideo as setHeroVideoEl, playTrailer, trailerSource, resetPlayer } from './hero-video.js';

const REPO = 'Stintik-123/GameVoice';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

applyCovers(GAMES);
const catalog = createCatalog(GAMES);

/* --------------------------------- герой --------------------------------- */

let heroTimer = null;
let heroHovering = false;
const isDesktopVideo = window.matchMedia('(min-width: 900px)').matches;

function heroGame() {
  return catalog.byId(state.heroId) || catalog.games[0] || null;
}

/** Переключает герой на соседнюю игру. */
function stepHero(delta) {
  if (!catalog.games.length) return;
  const current = catalog.games.findIndex((g) => g.id === state.heroId);
  const next = (current + delta + catalog.games.length) % catalog.games.length;
  renderHero(catalog.games[next]);
  startHero();
}

function stopHero() {
  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = null;
  }
}

function startHero() {
  stopHero();
  if (reduceMotion || catalog.games.length < 2 || heroHovering) return;
  heroTimer = setInterval(() => {
    if (heroHovering) return;
    const current = catalog.games.findIndex((g) => g.id === state.heroId);
    renderHero(catalog.games[(current + 1) % catalog.games.length], true);
  }, 40000);
}

function setHeroVideo(game) {
  setHeroVideoEl($('#heroVideo'), game, { allow: isDesktopVideo && !reduceMotion });
}

function renderHero(game, fromCarousel) {
  if (!game) return;
  state.heroId = game.id;

  const badge = $('#heroBadge');
  const title = $('#heroTitle');
  const desc = $('#heroDesc');
  const meta = $('#heroMeta');
  const tags = $('#heroTags');
  const bg = $('#heroBg');
  const favBtn = $('#favBtn');
  const pager = $('#heroCounter');

  if (badge) badge.textContent = 'В каталоге · ' + (game.developer || game.genre || 'GamesVoice');
  if (title) title.textContent = fullTitle(game);
  if (desc) desc.textContent = game.desc || '';
  if (meta) {
    const platforms = (game.platforms || []).map((p) => escapeHTML(p.toUpperCase())).join(' · ');
    meta.innerHTML = [
      game.genre ? `<span>${escapeHTML(game.genre)}</span>` : '',
      game.year ? `<span>${escapeHTML(game.year)}</span>` : '',
      `<span>${pluralVariants((game.translations || []).length)}</span>`,
      platforms ? `<span>${platforms}</span>` : '',
    ].filter(Boolean).join('');
  }
  if (tags) {
    tags.innerHTML = (game.tags || []).map((t) => `<span>#${escapeHTML(t)}</span>`).join('');
  }
  if (bg) {
    // под видео — баннер игры; пока трейлер грузится, он и есть фон
    const img = game.heroImage || game.cover;
    bg.style.cssText = img
      ? `background-image:url(${img});background-size:cover;background-position:center;`
      : coverStyle(game);
  }
  if (favBtn) {
    const isFav = state.favorites.has(game.id);
    favBtn.setAttribute('aria-pressed', String(isFav));
    favBtn.textContent = isFav ? '★ В избранном' : '☆ В избранное';
  }
  if (pager) {
    const index = catalog.games.findIndex((g) => g.id === game.id);
    pager.textContent = `${index + 1} / ${catalog.games.length}`;
  }
  const trailerBtn = $('#heroTrailerBtn');
  if (trailerBtn) trailerBtn.hidden = !trailerSource(game);
  setHeroVideo(game);
  if (!fromCarousel) startHero();
}

/* -------------------------------- рендер --------------------------------- */

function renderCatalog() {
  const list = catalog.filter({ query: state.query, filters: state.filters });
  const wrap = $('#carousel');
  const count = $('#resultsCount');

  if (count) count.textContent = `найдено: ${list.length} из ${catalog.games.length}`;
  if (wrap) {
    wrap.innerHTML = list.length
      ? list.map((game, i) => cardHTML(game, state.favorites.has(game.id), i, state.query)).join('')
      : `<div class="empty-state">
           <p>${state.query ? 'Ничего не найдено по запросу «' + escapeHTML(state.query) + '»' : 'Ничего не найдено'}</p>
           <p>Попробуйте другое название или сбросьте фильтры</p>
         </div>`;
  }
  const catalogWrap = $('#catalogWrap');
  if (catalogWrap) catalogWrap.dataset.view = state.view;
  updateChipCounts();
}

function updateChipCounts() {
  const counts = catalog.counts();
  $$('.chip[data-chip]').forEach((chip) => {
    const type = chip.dataset.chip;
    const base = chip.dataset.baseLabel || chip.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
    chip.dataset.baseLabel = base;
    chip.textContent = `${base} (${counts[type] || 0})`;
  });
}

function renderFavorites() {
  const grid = $('#favoritesGrid');
  const section = $('#favoritesSection');
  const countEl = $('#favCount');
  const mirror = $('[data-favcount-mirror]');
  const n = state.favorites.size;

  if (countEl) countEl.textContent = n;
  if (mirror) mirror.textContent = n;
  if (!grid || !section) return;
  if (!n) {
    section.style.display = 'none';
    grid.innerHTML = '';
    return;
  }
  section.style.display = '';
  grid.innerHTML = [...state.favorites]
    .map((id) => catalog.byId(id))
    .filter(Boolean)
    .map(miniCardHTML)
    .join('');
}

function renderHistory() {
  const grid = $('#historyGrid');
  const section = $('#historySection');
  if (!grid || !section) return;
  const items = state.history.map((id) => catalog.byId(id)).filter(Boolean);
  if (!items.length) {
    section.style.display = 'none';
    grid.innerHTML = '';
    return;
  }
  section.style.display = '';
  grid.innerHTML = items.map(miniCardHTML).join('');
}

function renderStats() {
  const row = $('#statsRow');
  if (row) row.innerHTML = statsHTML(catalog.counts());
}

/* ------------------------------ навигация -------------------------------- */

function openDetails(id, scroll) {
  const game = catalog.byId(id);
  if (!game) return;
  const list = $('#translationsList');
  const title = $('#detailsTitle');

  if (title) title.textContent = 'Варианты локализации — ' + game.title;
  if (list) list.innerHTML = (game.translations || []).map(translationHTML).join('');
  pushHistory(game.id);
  if (location.hash !== '#' + game.id) history.replaceState(null, '', '#' + game.id);
  renderHero(game);
  if (scroll) {
    const section = $('#details');
    if (section) section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

function onRoute(route) {
  if (route.name === 'game' && route.id && catalog.byId(route.id)) {
    openDetails(route.id, false);
    return;
  }
  if (route.name === 'favorites') {
    const section = $('#favoritesSection');
    if (section) section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

/* ------------------------------- модалки --------------------------------- */

let lastFocused = null;
let modalKeydown = null;

function focusables(modal) {
  return $$('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter(
    (el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true'
  );
}

function openModal(modal) {
  if (!modal) return;
  lastFocused = document.activeElement;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  const first = modal.querySelector('button, input, select, textarea, a[href]');
  if (first && first.focus) first.focus();

  if (modalKeydown) document.removeEventListener('keydown', modalKeydown);
  modalKeydown = (e) => {
    if (e.key === 'Escape') {
      closeModal(modal);
      return;
    }
    if (e.key !== 'Tab') return;
    const els = focusables(modal);
    if (!els.length) return;
    const head = els[0];
    const tail = els[els.length - 1];
    if (!e.shiftKey && document.activeElement === tail) {
      e.preventDefault();
      head.focus();
    } else if (e.shiftKey && document.activeElement === head) {
      e.preventDefault();
      tail.focus();
    }
  };
  document.addEventListener('keydown', modalKeydown);
}

function closeModal(modal) {
  if (!modal) return;
  if (modalKeydown) {
    document.removeEventListener('keydown', modalKeydown);
    modalKeydown = null;
  }
  modal.classList.remove('open');
  if (modal.id === 'trailerModal') {
    resetPlayer($('#videoFrame'));
  }
  if (!$$('.modal.open').length) document.body.style.overflow = '';
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function closeAllModals() {
  $$('.modal.open').forEach(closeModal);
  document.body.style.overflow = '';
}

function openTrailer(game) {
  if (!game) return;
  const src = trailerSource(game);
  if (!src) return;
  const modal = $('#trailerModal');
  const title = $('#trailerTitle');
  const tabs = $('#videoTabs');
  const frame = $('#videoFrame');
  if (!modal || !frame) return;

  if (title) title.textContent = 'Трейлер — ' + game.title;

  // вкладки только когда есть дополнительные ролики
  const extras = game.extraTrailers || [];
  if (tabs) {
    tabs.innerHTML = extras.length
      ? extras
          .map(
            (item, i) =>
              `<button type="button" data-id="${escapeHTML(item.id)}" class="${i === 0 ? 'active' : ''}">${escapeHTML(item.label || 'Трейлер ' + (i + 2))}</button>`
          )
          .join('')
      : '';
  }

  const setFrame = (item) => {
    if (item.kind === 'hls') {
      playTrailer(frame, { trailerHls: item.src, trailerPreview: item.poster });
    } else {
      resetPlayer(frame);
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${item.src}?autoplay=1&rel=0" title="Трейлер ${escapeHTML(game.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }
  };

  setFrame(src);

  if (tabs) {
    $$('#videoTabs button').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('#videoTabs button').forEach((x) => x.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.dataset.id;
        const extra = extras.find((x) => x.id === id);
        if (extra) {
          setFrame({ kind: 'youtube', src: extra.id, poster: '' });
        }
      });
    });
  }
  openModal(modal);
}

/* -------------------------------- тосты ---------------------------------- */

let toastTimer = null;
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* -------------------------------- фильтры -------------------------------- */

function populateFilters() {
  const genreSelect = $('#filterGenre');
  if (genreSelect) {
    genreSelect.innerHTML =
      '<option value="">Все жанры</option>' +
      catalog
        .genres()
        .map((genre) => `<option value="${escapeHTML(genre)}">${escapeHTML(genre)}</option>`)
        .join('');
    genreSelect.value = state.filters.genre || '';
  }
  const statusSelect = $('#filterStatus');
  if (statusSelect) {
    statusSelect.innerHTML =
      '<option value="">Любой статус</option><option value="done">Готово</option><option value="progress">В работе</option><option value="abandoned">Заброшено</option>';
    statusSelect.value = state.filters.status || '';
  }
  const sortSelect = $('#sortBy');
  if (sortSelect) {
    sortSelect.innerHTML =
      '<option value="updated">Сначала обновлённые</option><option value="year">Сначала новые</option><option value="count">Больше вариантов</option><option value="alpha">По алфавиту</option>';
    sortSelect.value = state.filters.sort || 'updated';
  }
  $$('#chips .chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.chip === state.filters.chip));
  $$('.view-toggle button').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === state.view));
}

function wireFilters() {
  $$('.view-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      $$('.view-toggle button').forEach((x) => x.classList.toggle('active', x === btn));
      saveFilters();
      renderCatalog();
    });
  });

  $$('#chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.filters.chip = state.filters.chip === chip.dataset.chip ? null : chip.dataset.chip;
      $$('#chips .chip').forEach((x) => x.classList.toggle('active', x.dataset.chip === state.filters.chip));
      saveFilters();
      renderCatalog();
    });
  });

  const genreSelect = $('#filterGenre');
  const statusSelect = $('#filterStatus');
  const sortSelect = $('#sortBy');
  if (genreSelect) genreSelect.addEventListener('change', (e) => { state.filters.genre = e.target.value; saveFilters(); renderCatalog(); });
  if (statusSelect) statusSelect.addEventListener('change', (e) => { state.filters.status = e.target.value; saveFilters(); renderCatalog(); });
  if (sortSelect) sortSelect.addEventListener('change', (e) => { state.filters.sort = e.target.value; saveFilters(); renderCatalog(); });

  const reset = $('#resetFilters');
  if (reset) {
    reset.addEventListener('click', () => {
      state.filters = { chip: null, genre: '', status: '', sort: 'updated' };
      state.query = '';
      const input = $('#searchInput');
      if (input) input.value = '';
      const clear = $('#searchClear');
      if (clear) clear.hidden = true;
      saveFilters();
      populateFilters();
      renderCatalog();
    });
  }
}

function wireSearch() {
  const input = $('#searchInput');
  const clear = $('#searchClear');
  if (!input) return;
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = input.value;
      if (clear) clear.hidden = !input.value;
      renderCatalog();
    }, 180);
  });
  if (clear) {
    clear.addEventListener('click', () => {
      input.value = '';
      state.query = '';
      clear.hidden = true;
      renderCatalog();
      input.focus();
    });
  }
}

function wireCards() {
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      e.stopPropagation();
      const id = fav.dataset.fav;
      const now = toggleFavorite(id);
      renderFavorites();
      renderCatalog();
      const game = catalog.byId(id);
      if (game && state.heroId === id) renderHero(game);
      showToast(now ? 'Добавлено в избранное' : 'Убрано из избранного');
      return;
    }
    const card = e.target.closest('.game-card[data-id], .mini-card[data-id]');
    if (card) openDetails(card.dataset.id, true);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('[data-fav]')) return;
    const card = e.target.closest('.game-card[data-id]');
    if (!card) return;
    e.preventDefault();
    openDetails(card.dataset.id, true);
  });
}

function wireModals() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) {
      closeAllModals();
      return;
    }
    if (e.target.classList.contains('modal')) closeAllModals();
  });

  const openers = [
    ['#faqBtn', '#faqModal'],
    ['#faqBtnMobile', '#faqModal'],
    ['#addBtn', '#addModal'],
    ['#addBtnMobile', '#addModal'],
    ['#fabAdd', '#addModal'],
  ];
  for (const [btnSel, modalSel] of openers) {
    const btn = $(btnSel);
    if (btn) btn.addEventListener('click', () => openModal($(modalSel)));
  }
  for (const id of ['aboutBtn', 'aboutBtnMobile', 'aboutBtnFooter', 'aboutOpenBtn']) {
    const el = $('#' + id);
    if (el) el.addEventListener('click', (e) => { e.preventDefault(); openModal($('#aboutModal')); });
  }
}

function wireAddForm() {
  const form = $('#addForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = value; });
    const title = encodeURIComponent('[Предложение] ' + (data.title || 'Новая игра'));
    const body = encodeURIComponent(
      `**Игра:** ${data.title || ''}\n**Тип:** ${data.type || ''}\n**Автор/студия:** ${data.author || '—'}\n**Ссылка:** ${data.url || '—'}\n\n${data.comment || ''}`
    );
    window.open(`https://github.com/${REPO}/issues/new?title=${title}&body=${body}`, '_blank', 'noopener');
    form.reset();
    closeModal($('#addModal'));
    showToast('Открыто окно создания issue на GitHub');
  });
}

function wireHero() {
  const trailerBtn = $('#heroTrailerBtn');
  const detailsBtn = $('#gotoDetailsBtn');
  const favBtn = $('#favBtn');
  const prevBtn = $('#heroPrev');
  const nextBtn = $('#heroNext');
  if (trailerBtn) trailerBtn.addEventListener('click', () => { const game = heroGame(); if (game) openTrailer(game); });
  if (detailsBtn) detailsBtn.addEventListener('click', () => { if (state.heroId) openDetails(state.heroId, true); });
  if (favBtn) favBtn.addEventListener('click', () => { if (state.heroId) { toggleFavorite(state.heroId); renderFavorites(); renderCatalog(); renderHero(heroGame()); } });
  if (prevBtn) prevBtn.addEventListener('click', () => stepHero(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => stepHero(1));

  const hero = $('#hero');
  if (hero) {
    hero.addEventListener('mouseenter', () => { heroHovering = true; stopHero(); });
    hero.addEventListener('mouseleave', () => { heroHovering = false; startHero(); });
  }
}

function wireTheme() {
  const btn = $('#themeBtn');
  if (!btn) return;
  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    btn.textContent = theme === 'dark' ? '🌙' : '☀️';
    write('theme', theme);
  };
  const saved = read('theme', null);
  if (saved) apply(saved);
  else apply(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  btn.addEventListener('click', () => {
    apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

function wireBurger() {
  const btn = $('#burgerBtn');
  const menu = $('#mobileMenu');
  const overlay = $('#menuOverlay');
  if (!btn || !menu) return;

  const close = () => {
    menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const open = () => {
    menu.classList.add('open');
    if (overlay) overlay.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  btn.addEventListener('click', () => (menu.classList.contains('open') ? close() : open()));
  if (overlay) overlay.addEventListener('click', close);
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) close();
  });
}

function wireHotkeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = $('#searchInput');
      if (input) input.focus();
    }
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
      e.preventDefault();
      const input = $('#searchInput');
      if (input) input.focus();
    }
  });
}

/* --------------------------------- старт --------------------------------- */

function init() {
  populateFilters();
  renderStats();
  renderFavorites();
  renderHistory();
  renderCatalog();
  wireFilters();
  wireSearch();
  wireCards();
  wireModals();
  wireAddForm();
  wireHero();
  wireTheme();
  wireBurger();
  wireHotkeys();

  const router = createRouter(onRoute);
  router.start();
  if (!state.heroId) renderHero(catalog.games[0]);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
