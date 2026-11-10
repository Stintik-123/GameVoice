/* Состояние и локальное хранилище. Единственное место, где живут данные
   между перезагрузками: избранное, история, оценки, тема, фильтры. */

const NS = 'gv_';

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}

export const state = {
  favorites: new Set(read('favorites', [])),
  history: read('history', []),
  ratings: read('ratings', {}),
  view: read('view', 'grid'),
  filters: read('filters', { chip: null, genre: '', status: '', sort: 'updated' }),
  query: '',
  heroId: null,
};

export function saveFilters() {
  write('filters', state.filters);
  write('view', state.view);
}

export function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  write('favorites', [...state.favorites]);
  return state.favorites.has(id);
}

export function pushHistory(id) {
  state.history = [id, ...state.history.filter((x) => x !== id)].slice(0, 8);
  write('history', state.history);
}

export function setRating(id, value) {
  state.ratings[id] = value;
  write('ratings', state.ratings);
}
