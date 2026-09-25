      break;
    case 'count':
      list = [...list].sort(
        (a, b) => b.translations.length - a.translations.length || byTitle(a, b)
      );
      break;
    case 'title':
      list = [...list].sort(byTitle);
      break;
    case 'updated':
      list = [...list].sort((a, b) => {
        const ua = latestUpdated(a) || '';
        const ub = latestUpdated(b) || '';
        if (ub !== ua) return ub.localeCompare(ua);
        return byTitle(a, b);
      });
      break;
    case 'rating':
    default: {
      list = [...list].sort((a, b) => {
        const ra = gameRating(a) ?? -1,
          rb = gameRating(b) ?? -1;
        if (rb !== ra) return rb - ra;
        return byTitle(a, b);
      });
      break;
    }
  }

  // Избранное сверху только без активных фильтров
  if (!hasActiveFilters() && state.favorites.size) {
    list = [
      ...list.filter(g => state.favorites.has(g.id)),
      ...list.filter(g => !state.favorites.has(g.id))
    ];
  }
  return list;
}

let autoRotate = true;
let rotateTimer = null;
const ytThumb = vid => `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

function selectGame(id, fromUser = true) {
  const game = games.find(g => g.id === id);
  if (!game) return;
  state.currentId = id;
  if (fromUser) stopRotation();
  if (fromUser || location.hash.slice(1) !== id) {
    try {
      history.replaceState(null, '', '#' + id);
    } catch {}
  }
  state.history = [id, ...state.history.filter(h => h !== id)].slice(0, 6);
  LS.set('history', state.history);
  renderHistory();

  const bg = $('#heroBg');
  if (bg) bg.className = 'hero-bg ' + game.coverClass;

  const poster = $('#heroPoster');
  if (poster) {
    poster.classList.remove('loaded');
    if (game.trailerId) {
      const img = new Image();
      img.onload = () => {
        poster.style.backgroundImage = `url("${ytThumb(game.trailerId)}")`;
        poster.classList.add('loaded');
      };
      img.src = ytThumb(game.trailerId);
    } else {
      poster.style.backgroundImage = '';
    }
  }

  window.__gvCurrentTrailer = game.trailerId || null;
  if (typeof window.setHeroBackgroundVideo === 'function') {
    window.setHeroBackgroundVideo(game.trailerId || null);
  }

  const setText = (sel, text) => {
    const el = $(sel);
    if (el) el.textContent = text;
  };
  setText('#heroBadge', state.favorites.has(id) ? '★ В избранном' : 'В каталоге · ' + game.developer);
  setText('#heroTitle', game.title + (game.subtitle ? ' ' + game.subtitle : ''));
  setText('#heroDesc', game.desc);

  const r = gameRating(game);
