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
  writeURLState();
  const cl = $('#searchClear');
  if (cl) cl.hidden = true;
  toast('Фильтры сброшены');
}

function initChips() {
  on($('#chips'), 'click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.type = state.type === chip.dataset.chip ? 'all' : chip.dataset.chip;
    applyFiltersUI();
    renderCatalog();
    writeURLState();
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
