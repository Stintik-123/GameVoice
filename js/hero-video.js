/* ============================================================
   GameVoice — hero-video.js
   Ховер-превью для карточек каталога (муted, локальные .webm/.mp4).

   Сейчас в data.js ни у одной игры нет videoSrc/heroVideoSrc — Feliks
   сказал, что пока временно используется YouTube (только в модалке
   трейлера, по клику), а свои ролики планирует залить позже.
   Этот файл НЕ трогает YouTube — он просто ждёт, пока у карточек
   появится реальный videoSrc, и включает автопревью на ховере тогда.
   Ничего не выдумывает и не подставляет вместо отсутствующего видео.
   ============================================================ */

(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentlyPlaying = null;

  function attach(card, game) {
    if (reduceMotion || !game || !game.videoSrc) return; // нет ассета — ничего не подключаем
    const video = card.querySelector('.cover-video');
    if (!video) return;
    video.dataset.src = game.videoSrc;

    card.addEventListener('mouseenter', () => {
      if (currentlyPlaying && currentlyPlaying !== video) {
        currentlyPlaying.pause();
        currentlyPlaying.currentTime = 0;
      }
      if (!video.src) video.src = video.dataset.src;
      video.play().catch(() => {});
      currentlyPlaying = video;
    });
    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
      if (currentlyPlaying === video) currentlyPlaying = null;
    });
  }

  // Re-scan the catalog every time app.js re-renders it (grid/list/carousel/favorites/history).
  function scan() {
    document.querySelectorAll('.game-card[data-id]').forEach(card => {
      const game = (typeof games !== 'undefined' ? games : []).find(g => g.id === card.dataset.id);
      attach(card, game);
    });
  }

  const observer = new MutationObserver(() => scan());
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
  });
})();

