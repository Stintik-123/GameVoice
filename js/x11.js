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
