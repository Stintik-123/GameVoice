/* Фоновое видео в hero и воспроизведение трейлера в модалке.
   HLS-трейлер Steam (приоритет) или YouTube-embed.
   HLS играется через локальную копию hls.js; нативная поддержка — в Safari. */

let hlsInstance = null;
let hlsLoading = null;

/** Подключает hls.js один раз, отдаёт промис с библиотекой (или null). */
function loadHls() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (hlsLoading) return hlsLoading;
  hlsLoading = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'js/vendor/hls.min.js';
    s.async = true;
    s.onload = () => resolve(window.Hls || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return hlsLoading;
}

function destroyHls() {
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
}

/** Источник трейлера игры: HLS или YouTube-embed. */
export function trailerSource(game) {
  if (!game) return null;
  if (game.trailerHls) return { kind: 'hls', src: game.trailerHls, poster: game.trailerPreview || '' };
  if (game.trailerId) return { kind: 'youtube', src: game.trailerId, poster: game.trailerPreview || '' };
  return null;
}

/** Чистит контейнер и останавливает текущий HLS-проигрыватель. */
export function resetPlayer(container) {
  if (!container) return;
  destroyHls();
  container.innerHTML = '';
}

/**
 * Показывает фоновое видео в контейнере.
 * @param {HTMLElement} wrap контейнер #heroVideo
 * @param {object} game     игра
 * @param {object} opts     { allow: boolean }
 */
export function setHeroVideo(wrap, game, opts = {}) {
  if (!wrap) return;
  const allow = opts.allow !== false;
  const src = allow ? trailerSource(game) : null;

  if (!src) {
    wrap.classList.remove('is-on');
    wrap.removeAttribute('data-src');
    resetPlayer(wrap);
    return;
  }

  const key = src.kind + ':' + src.src;
  if (wrap.dataset.src === key) {
    wrap.classList.add('is-on');
    const v = wrap.querySelector('video');
    if (v && v.paused) v.play().catch(() => {});
    return;
  }
  wrap.dataset.src = key;
  wrap.classList.add('is-on');

  if (src.kind === 'hls') {
    wrap.innerHTML = `<video class="hero-video__el" muted playsinline loop preload="metadata"
      poster="${escapeAttr(src.poster)}"></video>`;
    const video = wrap.querySelector('video');
    loadHls().then((Hls) => {
      if (!Hls || !video.isConnected) return;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src.src;
        video.play().catch(() => {});
        return;
      }
      if (!Hls.isSupported()) return;
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false, capLevelToPlayerSize: true });
      hls.loadSource(src.src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) hls.destroy();
      });
      hlsInstance = hls;
      video.play().catch(() => {});
    });
    return;
  }

  // YouTube-embed (ручные карточки)
  const id = src.src;
  wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${id}" title="" allow="autoplay; encrypted-media" tabindex="-1"></iframe>`;
}

/**
 * Воспроизводит трейлер в модалке.
 * @param {HTMLElement} container контейнер под видео
 * @param {object} game           игра
 */
export function playTrailer(container, game) {
  if (!container) return;
  const src = trailerSource(game);
  resetPlayer(container);
  if (!src) return;

  if (src.kind === 'hls') {
    container.innerHTML = `<video class="trailer-video" controls autoplay playsinline poster="${escapeAttr(src.poster)}"></video>`;
    const video = container.querySelector('video');
    loadHls().then((Hls) => {
      if (!Hls || !video.isConnected) return;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src.src;
        return;
      }
      if (!Hls.isSupported()) return;
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(src.src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) hls.destroy();
      });
      hlsInstance = hls;
    });
    return;
  }

  container.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${src.src}?autoplay=1&rel=0" title="Трейлер" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}

function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
