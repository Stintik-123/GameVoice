/* Фильтрация, сортировка и подсчёты каталога. */
import { buildIndex, matches, queryTokens } from './search.js';

export function createCatalog(games) {
  const index = buildIndex(games);

  function byId(id) {
    return games.find((g) => g.id === id) || null;
  }

  function hasType(game, type) {
    return (game.translations || []).some((t) => {
      if (type === 'voice') return t.type === 'voice' || t.type === 'both';
      if (type === 'text') return t.type === 'text' || t.type === 'both';
      return t.type === type;
    });
  }

  function matchesFilters(game, filters) {
    if (filters.chip && !hasType(game, filters.chip)) return false;
    if (filters.genre && game.genre !== filters.genre) return false;
    if (filters.status && !(game.translations || []).some((t) => t.status === filters.status)) return false;
    return true;
  }

  function lastUpdated(game) {
    let max = '';
    for (const t of game.translations || []) {
      if ((t.updated || '') > max) max = t.updated;
    }
    return max;
  }

  const SORTS = {
    updated: (a, b) => lastUpdated(b).localeCompare(lastUpdated(a)),
    year: (a, b) => (b.year || '').localeCompare(a.year || ''),
    count: (a, b) => (b.translations?.length || 0) - (a.translations?.length || 0),
    alpha: (a, b) => a.title.localeCompare(b.title, 'ru'),
  };

  function filter({ query = '', filters = {} } = {}) {
    const tokens = queryTokens(query);
    const list = index
      .filter((entry) => matches(entry, tokens))
      .map((entry) => entry.game)
      .filter((game) => matchesFilters(game, filters));
    const sort = SORTS[filters.sort] || SORTS.updated;
    return list.sort(sort);
  }

  function genres() {
    const set = new Set();
    for (const g of games) if (g.genre) set.add(g.genre);
    return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
  }

  function counts() {
    return {
      total: games.length,
      text: games.filter((g) => hasType(g, 'text')).length,
      voice: games.filter((g) => hasType(g, 'voice')).length,
      both: games.filter((g) => hasType(g, 'both')).length,
      official: games.filter((g) => (g.tags || []).includes('официальный перевод')).length,
      fan: games.filter((g) => (g.tags || []).includes('фанатская озвучка')).length,
      done: games.reduce((n, g) => n + (g.translations || []).filter((t) => t.status === 'done').length, 0),
    };
  }

  return { games, byId, filter, genres, counts, lastUpdated, hasType };
}
