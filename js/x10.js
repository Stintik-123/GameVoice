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
