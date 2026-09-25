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
  const plats = g.platforms.slice(0, 3).map(p => PLATFORM_LABELS[p] || p).join(' · ');
  return `
  <div class="game-card ${g.id === state.currentId ? 'active' : ''}" data-id="${g.id}" tabindex="0" role="button" aria-label="${esc(g.title)}">
