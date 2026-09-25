/* ============================================================
   GameVoice — app.js
   Без сборки, без фреймворков. Всё на localStorage + DOM.
   ============================================================ */

(() => {
  'use strict';

  const REPO = 'Stintik-123/GameVoice';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- localStorage helpers ----------
  const store = {
    get(key, fallback) {
      try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
      catch { return fallback; }
    },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
  };

  const state = {
    favorites: new Set(store.get('gv_favorites', [])),
    history: store.get('gv_history', []),
    userRatings: store.get('gv_ratings', {}),
    view: store.get('gv_view', 'grid'),
    filters: { chip: null, genre: '', status: '', platform: '', sort: 'rating' },
    query: '',
    heroIndex: 0
  };

  const bestRating = (g) => Math.max(0, ...g.translations.map(t => t.rating || 0));
  const translationCount = (g) => g.translations.length;
  const lastUpdated = (g) => g.translations.reduce((max, t) => (t.updated && t.updated > max ? t.updated : max), '0000');

  // very small transliteration map so "cyberpunk" also matches "киберпанк"-style typing
  const translitPairs = [
    ['a','а'],['b','б'],['v','в'],['g','г'],['d','д'],['e','е'],['z','з'],['i','и'],
    ['y','й'],['k','к'],['l','л'],['m','м'],['n','н'],['o','о'],['p','п'],['r','р'],
    ['s','с'],['t','т'],['u','у'],['f','ф'],['h','х'],['c','к'],['j','дж']
  ];
  function translit(str) {
    let out = str.toLowerCase();
    translitPairs.forEach(([lat, cyr]) => { out = out.split(cyr).join(lat); });
    return out;
  }

  function matchesQuery(g, q) {
    if (!q) return true;
    const hay = translit([g.title, g.subtitle, g.developer, g.genre, ...(g.tags||[])].join(' '));
    return hay.includes(translit(q));
  }

  function matchesFilters(g) {
    const f = state.filters;
    if (f.chip && !g.translations.some(t => t.type === f.chip)) return false;
    if (f.genre && g.genre !== f.genre) return false;
    if (f.status && !g.translations.some(t => t.status === f.status)) return false;
    if (f.platform && !(g.platforms || []).includes(f.platform)) return false;
    return true;
  }

  function sortGames(list) {
    const s = state.filters.sort;
    const copy = [...list];
    if (s === 'rating') copy.sort((a,b) => bestRating(b) - bestRating(a));
    else if (s === 'updated') copy.sort((a,b) => lastUpdated(b).localeCompare(lastUpdated(a)));
    else if (s === 'year') copy.sort((a,b) => (b.year||'').localeCompare(a.year||''));
    else if (s === 'count') copy.sort((a,b) => translationCount(b) - translationCount(a));
    else if (s === 'alpha') copy.sort((a,b) => a.title.localeCompare(b.title));
    return copy;
  }

  function getFiltered() {
    return sortGames(games.filter(g => matchesQuery(g, state.query) && matchesFilters(g)));
  }

  // ---------- Rendering ----------
  function coverStyle(g) {
    // No real artwork provided — use a deterministic gradient per coverClass as a stand-in
    // until real cover images/trailers are supplied.
    return `background: linear-gradient(160deg, hsl(${hashHue(g.coverClass)},38%,20%), hsl(${hashHue(g.coverClass)+30},30%,10%));`;
  }
  function hashHue(str) {
    let h = 0; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  function cardHTML(g) {
    const fav = state.favorites.has(g.id);
    return `
      <article class="game-card" data-id="${g.id}" tabindex="0" role="button" aria-label="${g.title}">
        <div class="cover-still" style="position:absolute;inset:0;${coverStyle(g)}"></div>
        <video class="cover-video" muted loop playsinline preload="none" data-src=""></video>
        <div class="game-card-info">
          <div class="game-card-title">${g.title}${fav ? ' ★' : ''}</div>
          <div class="game-card-meta">${g.year} · ${translationCount(g)} вар. · ★ ${bestRating(g).toFixed(1)}</div>
        </div>
      </article>`;
  }

  function renderCatalog() {
    const list = getFiltered();
    $('#resultsCount').textContent = `найдено: ${list.length} из ${games.length}`;
    $('#carousel').innerHTML = list.map(cardHTML).join('') || `<p class="link-muted">Ничего не найдено — попробуйте сбросить фильтры.</p>`;
    $('#catalogWrap').dataset.view = state.view;
  }

  function renderTop10() {
    const top = sortGames(games).slice().sort((a,b)=>bestRating(b)-bestRating(a)).slice(0, 10);
    $('#top10List').innerHTML = top.map(g => `
      <li data-id="${g.id}">
        <span></span>
        <span class="top10-cover" style="${coverStyle(g)}"></span>
        <span>
          <div class="top10-name">${g.title}</div>
          <div class="top10-sub">${g.developer} · ${translationCount(g)} вариантов</div>
        </span>
        <span class="top10-score">★ ${bestRating(g).toFixed(1)}</span>
      </li>`).join('');
    // honest label: this is the editorial rating field from data.js, not a live community vote
    $('.top10-section .results-count').textContent = 'рейтинг по данным каталога (не голосование пользователей)';
  }

  function renderFavorites() {
    const favGames = games.filter(g => state.favorites.has(g.id));
    $('#favCount').textContent = String(favGames.length);
    const mirror = $('[data-favcount-mirror]'); if (mirror) mirror.textContent = String(favGames.length);
    const section = $('#favoritesSection');
    if (!favGames.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    $('#favoritesGrid').innerHTML = favGames.map(cardHTML).join('');
  }

  function renderHistory() {
    const items = state.history.map(id => games.find(g => g.id === id)).filter(Boolean);
    const section = $('#historySection');
    if (!items.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    $('#historyGrid').innerHTML = items.map(cardHTML).join('');
  }

  function renderNews() {
    // No real news items were supplied — an honest empty state beats invented headlines.
    $('#newsGrid').innerHTML = `<p class="link-muted">Пока нет записей. Как только выйдет новая версия перевода — она появится здесь.</p>`;
  }

  function renderStats() {
    const total = games.length;
    const withVoice = games.filter(g => g.translations.some(t => t.type === 'voice' || t.type === 'both')).length;
    const done = games.reduce((sum,g) => sum + g.translations.filter(t=>t.status==='done').length, 0);
    $('#statsRow').innerHTML = `
      <span><b>${total}</b>игр в каталоге</span>
      <span><b>${withVoice}</b>с озвучкой</span>
      <span><b>${done}</b>готовых вариантов</span>`;
  }

  function populateFilterSelects() {
    const genres = [...new Set(games.map(g => g.genre))].sort();
    const platforms = [...new Set(games.flatMap(g => g.platforms || []))].sort();
    $('#filterType').innerHTML = `<option value="">Все жанры</option>` + genres.map(g=>`<option value="${g}">${g}</option>`).join('');
    $('#filterType').setAttribute('aria-label', 'Жанр');
    $('#filterStatus').innerHTML = `<option value="">Любой статус</option><option value="done">Готово</option><option value="progress">В работе</option>`;
    $('#filterPlatform').innerHTML = `<option value="">Все платформы</option>` + platforms.map(p=>`<option value="${p}">${p.toUpperCase()}</option>`).join('');
    $('#sortBy').innerHTML = `
      <option value="rating">Сначала рейтинг</option>
      <option value="updated">Сначала обновлённые</option>
      <option value="year">Сначала новые</option>
      <option value="count">Больше вариантов</option>
      <option value="alpha">По алфавиту</option>`;
  }

  // ---------- Hero ----------
  function renderHero(g) {
    $('#heroBadge').textContent = `В каталоге · ${g.developer}`;
    $('#heroTitle').textContent = g.title + (g.subtitle ? ' ' + g.subtitle : '');
    $('#heroDesc').textContent = g.desc || '';
    $('#heroMeta').innerHTML = `${g.genre} · ${g.year} · ${translationCount(g)} варианта${(g.platforms||[]).length ? ' · ' + g.platforms.join(', ').toUpperCase() : ''}`;
    $('#heroTags').innerHTML = (g.tags||[]).map(t=>`<span>#${t}</span>`).join('');
    $('#heroBg').style.cssText = coverStyle(g);
    const favBtn = $('#favBtn');
    favBtn.setAttribute('aria-pressed', state.favorites.has(g.id));
    favBtn.textContent = state.favorites.has(g.id) ? '★ В избранном' : '☆ В избранное';
    favBtn.onclick = () => toggleFavorite(g.id);
    $('#heroTrailerBtn').onclick = () => openTrailer(g);
    $('#gotoDetailsBtn').onclick = () => openDetails(g.id, true);
    $('#heroDots').innerHTML = games.map((gg,i)=>`<button role="tab" aria-selected="${gg.id===g.id}" aria-label="${gg.title}"></button>`).join('');
    $$('#heroDots button').forEach((btn,i) => btn.onclick = () => { state.heroIndex = i; renderHero(games[i]); });
  }

  // ---------- Details ----------
  function statusLabel(s) { return s === 'done' ? 'готово' : s === 'progress' ? 'в работе' : s; }
  function typeLabel(t) { return {text:'текст', voice:'озвучка', both:'текст + озвучка', subtitles:'субтитры'}[t] || t; }

  function translationHTML(g, t, idx) {
    const rKey = `${g.id}:${idx}`;
    const myRating = state.userRatings[rKey] || 0;
    return `
      <div class="translation-card">
        <div class="t-head">
          <div>
            <div class="t-name">${t.name}</div>
            <div class="t-badges">
              <span>${t.author}</span>
              <span class="status-${t.status}">${statusLabel(t.status)}</span>
              <span>${typeLabel(t.type)}</span>
              ${t.version ? `<span>${t.version}</span>` : ''}
              ${t.updated ? `<span>обновлено ${t.updated}</span>` : ''}
            </div>
          </div>
          <div class="rating-stars" data-key="${rKey}" aria-label="Ваша оценка">
            ${[1,2,3,4,5].map(n=>`<button data-n="${n}" class="${n<=myRating?'filled':''}" aria-label="${n} из 5">★</button>`).join('')}
          </div>
        </div>
        ${t.body || ''}
        ${t.install || ''}
        <div class="t-links">${t.links || ''}</div>
      </div>`;
  }

  function openDetails(id, scroll) {
    const g = games.find(x => x.id === id);
    if (!g) return;
    $('#detailsTitle').textContent = `Варианты локализации — ${g.title}`;
    $('#translationsList').innerHTML = g.translations.map((t,i)=>translationHTML(g,t,i)).join('');
    $$('.rating-stars').forEach(box => {
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-n]');
        if (!btn) return;
        const n = Number(btn.dataset.n);
        state.userRatings[box.dataset.key] = n;
        store.set('gv_ratings', state.userRatings);
        $$('button', box).forEach(b => b.classList.toggle('filled', Number(b.dataset.n) <= n));
      });
    });
    pushHistory(g.id);
    location.hash = g.id;
    if (scroll) $('#details').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function pushHistory(id) {
    state.history = [id, ...state.history.filter(x => x !== id)].slice(0, 8);
    store.set('gv_history', state.history);
    renderHistory();
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    store.set('gv_favorites', [...state.favorites]);
    renderFavorites();
    const g = games.find(x=>x.id===id);
    if (g && $('#heroTitle').textContent.startsWith(g.title)) renderHero(g);
    showToast(state.favorites.has(id) ? 'Добавлено в избранное' : 'Убрано из избранного');
  }

  // ---------- Trailer modal ----------
  function openTrailer(g) {
    const modal = $('#trailerModal');
    $('#trailerTitle').textContent = `Трейлер — ${g.title}`;
    const tabs = [{ id: g.trailerId, label: 'Основной' }, ...(g.extraTrailers||[])];
    $('#videoTabs').innerHTML = tabs.map((t,i)=>`<button data-id="${t.id}" class="${i===0?'active':''}">${t.label}</button>`).join('');
    const setFrame = (id) => {
      $('#videoFrame').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Трейлер ${g.title}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    };
    setFrame(tabs[0].id);
    $$('#videoTabs button').forEach(btn => btn.onclick = () => {
      $$('#videoTabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      setFrame(btn.dataset.id);
    });
    openModal(modal);
  }

  // ---------- Modal helpers (focus in/out) ----------
  let lastFocused = null;
  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.classList.add('open');
    const focusable = modal.querySelector('button, input, select, textarea, a[href]');
    (focusable || modal).focus?.();
  }
  function closeModal(modal) {
    modal.classList.remove('open');
    $('#videoFrame') && (modal.id === 'trailerModal') && ($('#videoFrame').innerHTML = '');
    lastFocused?.focus?.();
  }
  function closeAllModals() { $$('.modal.open').forEach(closeModal); }

  // ---------- Add game -> GitHub Issues (no fake backend) ----------
  function wireAddForm() {
    $('#addForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const draft = Object.fromEntries(fd.entries());
      const drafts = store.get('gv_drafts', []);
      drafts.push({ ...draft, savedAt: new Date().toISOString() });
      store.set('gv_drafts', drafts);

      const title = encodeURIComponent(`[Предложение] ${draft.title || 'Новая игра'}`);
      const body = encodeURIComponent(
        `**Игра:** ${draft.title}\n**Тип:** ${draft.type}\n**Автор/студия:** ${draft.author || '—'}\n**Ссылка:** ${draft.url || '—'}\n\n${draft.comment || ''}`
      );
      window.open(`https://github.com/${REPO}/issues/new?title=${title}&body=${body}`, '_blank', 'noopener');
      $('#draftsNote').style.display = '';
      $('#draftsNote').textContent = 'Черновик сохранён локально, и открылась страница создания issue на GitHub — отправьте её, чтобы предложение реально попало к редакторам.';
      e.target.reset();
    });
  }

  // ---------- Toast / to-top ----------
  let toastTimer;
  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- View / filters wiring ----------
  function wireViewAndFilters() {
    $$('.view-toggle button').forEach(btn => btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      store.set('gv_view', state.view);
      $$('.view-toggle button').forEach(b=>b.classList.toggle('active', b===btn));
      renderCatalog();
    }));
    $$('.chip').forEach(chip => chip.addEventListener('click', () => {
      const on = !chip.classList.contains('active');
      $$('.chip').forEach(c=>c.classList.remove('active'));
      chip.classList.toggle('active', on);
      state.filters.chip = on ? chip.dataset.chip : null;
      renderCatalog();
    }));
    $('#filterType').addEventListener('change', e => { state.filters.genre = e.target.value; renderCatalog(); });
    $('#filterStatus').addEventListener('change', e => { state.filters.status = e.target.value; renderCatalog(); });
    $('#filterPlatform').addEventListener('change', e => { state.filters.platform = e.target.value; renderCatalog(); });
    $('#sortBy').addEventListener('change', e => { state.filters.sort = e.target.value; renderCatalog(); renderTop10(); });
    $('#resetFilters').addEventListener('click', () => {
      state.filters = { chip: null, genre:'', status:'', platform:'', sort:'rating' };
      state.query = '';
      $('#searchInput').value = '';
      $$('.chip').forEach(c=>c.classList.remove('active'));
      $$('.selects select').forEach(s=>s.value='');
      renderCatalog();
    });
  }

  function wireSearch() {
    const input = $('#searchInput');
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      $('#searchClear').hidden = !input.value;
      t = setTimeout(() => { state.query = input.value.trim(); renderCatalog(); }, 120);
    });
    $('#searchClear').addEventListener('click', () => { input.value=''; state.query=''; $('#searchClear').hidden = true; renderCatalog(); input.focus(); });
  }

  function wireCardClicks() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.game-card');
      if (card) openDetails(card.dataset.id, true);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList?.contains('game-card')) openDetails(e.target.dataset.id, true);
    });
  }

  function wireModals() {
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    $$('.modal').forEach(modal => modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); }));
    $('#addBtn').addEventListener('click', () => openModal($('#addModal')));
    $('#addBtnMobile')?.addEventListener('click', () => openModal($('#addModal')));
    $('#faqBtn').addEventListener('click', () => openModal($('#faqModal')));
    $('#faqBtnMobile')?.addEventListener('click', () => openModal($('#faqModal')));
    $('#faqBtnFooter')?.addEventListener('click', () => openModal($('#faqModal')));
    $('#footerFaqLink')?.addEventListener('click', (e) => { e.preventDefault(); openModal($('#faqModal')); });
  }

  function wireHeaderExtras() {
    $('#randomBtn').addEventListener('click', () => {
      const g = games[Math.floor(Math.random() * games.length)];
      renderHero(g);
      $('#hero').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    $('#themeBtn').addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme;
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      store.set('gv_theme', next);
    });
    const savedTheme = store.get('gv_theme', null);
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;

    $('#burgerBtn').addEventListener('click', () => {
      const menu = $('#mobileMenu');
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menu.hidden = !open;
      $('#burgerBtn').setAttribute('aria-expanded', String(open));
    });
    $$('.mobile-menu a, .mobile-menu button').forEach(el => el.addEventListener('click', () => {
      $('#mobileMenu').classList.remove('open'); $('#mobileMenu').hidden = true;
    }));
  }

  function wireTabbar() {
    const bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.setAttribute('aria-label', 'Нижняя навигация');
    bar.innerHTML = `
      <button data-goto="#catalog" class="active"><span class="tab-icon">📦</span>Каталог</button>
      <button data-goto="#top10"><span class="tab-icon">🔥</span>Топ</button>
      <button data-goto="#favoritesSection"><span class="tab-icon">★</span>Избранное</button>
      <button data-open-menu="1"><span class="tab-icon">☰</span>Меню</button>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      $$('.tabbar button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.goto) $(btn.dataset.goto)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      if (btn.dataset.openMenu) $('#burgerBtn').click();
    });
  }

  function wireToTop() {
    const btn = $('#toTop');
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 800), { pa
