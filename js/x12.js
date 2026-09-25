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
