        return;
      }
      copyText(url)
        .then(() => toast('Ссылка скопирована · Ctrl+клик — открыть'))
        .catch(() => toast('Не удалось скопировать'));
      return;
    }
    const rep = e.target.closest('[data-report]');
    if (rep) {
      const key = state.currentId + '::' + rep.dataset.report;
      if (state.broken.has(key)) {
        state.broken.delete(key);
        toast('Отметка снята');
      } else {
        state.broken.add(key);
        toast('Спасибо! Отметили как «проверить ссылку»');
      }
      LS.set('broken', [...state.broken]);
      renderDetails(games.find(g => g.id === state.currentId));
    }
  });
}

function bindShare() {
  on($('#voteBox'), 'click', e => {
    if (!e.target.closest('#shareGameBtn') || !state.currentId) return;
    const url = location.origin + location.pathname + '#' + state.currentId;
    const game = games.find(g => g.id === state.currentId);
    const title = game ? game.title : 'GameVoice';
    if (navigator.share) {
      navigator
        .share({ title: title + ' — GameVoice', url, text: 'Русские локализации: ' + title })
        .catch(() => copyText(url).then(() => toast('Ссылка скопирована')));
    } else {
      copyText(url)
        .then(() => toast('Ссылка на игру скопирована'))
        .catch(() => toast('Не удалось скопировать'));
    }
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = $('#themeBtn');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
  LS.set('theme', theme);
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* —— Модалки с управлением фокусом —— */
let lastFocus = null;

function openModal(id) {
  const el = typeof id === 'string' ? $(id) : id;
  if (!el) return;
  lastFocus = document.activeElement;
  el.classList.add('open');
  document.body.classList.add('no-scroll');
  const focusable = el.querySelector(
    '[data-close], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) {
    requestAnimationFrame(() => focusable.focus());
  }
}

function closeModal(m) {
  if (!m) return;
  m.classList.remove('open');
  if (m.id === 'trailerModal') stopVideo();
  if (!$$('.modal.open').length) {
    document.body.classList.remove('no-scroll');
    if (lastFocus && typeof lastFocus.focus === 'function') {
