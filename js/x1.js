}

/** Самая свежая дата обновления среди переводов игры (YYYY-MM). */
function latestUpdated(g) {
  let best = '';
  for (const t of g.translations) {
    if (t.updated && t.updated > best) best = t.updated;
  }
  return best;
}

/** Обновление за последний месяц → плашка «Новинка». */
function isNewGame(g) {
  const u = latestUpdated(g);
  if (!u) return false;
  const [y, m] = u.split('-').map(Number);
  if (!y || !m) return false;
  const now = new Date();
  const then = new Date(y, m - 1, 1);
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth());
  return months <= 1;
}

function hasActiveFilters() {
  return (
    state.search.trim() !== '' ||
    state.type !== 'all' ||
    state.status !== 'all' ||
    state.platform !== 'all'
  );
}

/** Минимальный транслит RU↔LAT для поиска. */
function translit(s) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };
  return s.replace(/[а-яё]/g, c => map[c] || c);
}

function filteredGames() {
  const q = state.search.toLowerCase().trim();
  const qLat = translit(q);
  let list = games.filter(g => {
    if (q) {
      const authors = g.translations
        .map(t => (t.author || '') + ' ' + (t.name || ''))
        .join(' ');
      const hay = (
        g.title +
        ' ' +
        (g.subtitle || '') +
        ' ' +
        g.desc +
        ' ' +
        g.genre +
        ' ' +
        g.developer +
        ' ' +
        g.tags.join(' ') +
        ' ' +
        authors
      ).toLowerCase();
      const hayLat = translit(hay);
      if (!hay.includes(q) && !hayLat.includes(qLat) && !hay.includes(qLat) && !hayLat.includes(q))
        return false;
    }
    if (state.type !== 'all' && !g.translations.some(t => t.type === state.type)) return false;
    if (state.status !== 'all' && !g.translations.some(t => t.status === state.status)) return false;
    if (state.platform !== 'all' && !g.platforms.includes(state.platform)) return false;
    return true;
  });

  const byTitle = (a, b) => a.title.localeCompare(b.title, 'ru');
  switch (state.sort) {
    case 'year-desc':
      list = [...list].sort((a, b) => b.year - a.year || byTitle(a, b));
      break;
    case 'year-asc':
      list = [...list].sort((a, b) => a.year - b.year || byTitle(a, b));
