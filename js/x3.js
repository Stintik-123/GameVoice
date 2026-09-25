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
