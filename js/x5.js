    <div class="game-card-cover ${g.coverClass}" data-letter="${esc(g.title.charAt(0))}">
      <button class="fav-star ${fav ? 'on' : ''}" data-fav="${g.id}" title="В избранное" aria-label="В избранное">${fav ? '★' : '☆'}</button>
      ${neu ? `<span class="badge-new">Новинка</span>` : ''}
      ${r ? `<span class="card-rating">★ ${r.toFixed(1)}</span>` : ''}
      <div class="game-card-title">
        ${esc(g.title)}
        <span class="game-card-count">${countLabel(g)} · ${g.year}</span>
        <span class="game-card-meta">${esc(g.genre)}${plats ? ' · ' + esc(plats) : ''}</span>
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
