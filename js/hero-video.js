/* GameVoice — muted YouTube trailer as hero background (desktop only) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  let bgVideoId = null;
  let bgVideoTimer = null;

  function canPlay() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia('(max-width: 768px)').matches) return false;
    if (document.hidden) return false;
    return true;
  }

  window.setHeroBackgroundVideo = function (vid) {
    const box = $('#heroVideo');
    if (!box) return;
    clearTimeout(bgVideoTimer);
    if (!vid || !canPlay()) {
      box.innerHTML = '';
      box.classList.remove('on');
      bgVideoId = null;
      return;
    }
    if (bgVideoId === vid && box.querySelector('iframe')) {
      box.classList.add('on');
      return;
    }
    bgVideoId = vid;
    bgVideoTimer = setTimeout(() => {
      box.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + vid +
        '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + vid +
        '&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1" ' +
        'title="" frameborder="0" allow="autoplay; encrypted-media" tabindex="-1"></iframe>';
      box.classList.add('on');
    }, 400);
  };

  document.addEventListener('visibilitychange', () => {
    if (typeof window.__gvCurrentTrailer === 'string') {
      window.setHeroBackgroundVideo(document.hidden ? null : window.__gvCurrentTrailer);
    }
  });
  window.addEventListener('resize', () => {
    if (typeof window.__gvCurrentTrailer === 'string') {
      window.setHeroBackgroundVideo(window.__gvCurrentTrailer);
    }
  });
})();
