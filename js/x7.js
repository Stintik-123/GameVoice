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
