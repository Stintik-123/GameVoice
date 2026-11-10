/* Хэш-роутинг: #catalog, #favoritesSection, #<id-игры>.
   Возвращает разбор хэша и умеет подписываться на изменения. */

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  if (!raw) return { name: 'home', id: null };
  if (raw === 'catalog') return { name: 'catalog', id: null };
  if (raw === 'favorites' || raw === 'favoritesSection') return { name: 'favorites', id: null };
  if (raw === 'about') return { name: 'about', id: null };
  return { name: 'game', id: raw };
}

export function createRouter(onRoute) {
  function handle() {
    onRoute(parseHash(location.hash));
  }
  window.addEventListener('hashchange', handle);
  return {
    start: handle,
    go(id) {
      location.hash = id;
    },
    replace(id) {
      history.replaceState(null, '', '#' + id);
      handle();
    },
  };
}
