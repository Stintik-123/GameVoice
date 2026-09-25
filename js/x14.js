  try {
    history.replaceState(null, '', next);
  } catch {}
}

function pickRandomGame() {
  const list = filteredGames();
  const pool = list.length ? list : games;
  if (!pool.length) return;
  const g = pool[Math.floor(Math.random() * pool.length)];
  selectGame(g.id);
  $('#details')?.scrollIntoView({ behavior: 'smooth' });
  toast('Случайная: ' + g.title);
}

function setView(view) {
  if (!['grid', 'list', 'carousel'].includes(view)) return;
  state.view = view;
  LS.set('view', state.view);
  $$('.view-toggle button').forEach(x =>
    x.classList.toggle('active', x.dataset.view === state.view)
  );
  applyViewClass();
  renderCatalog();
  writeURLState();
}

function initScrollSpy() {
  const links = $$('.nav .nav-link[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    if (sec) map.set(sec, a);
  });
  if (!map.size) return;
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const link = map.get(en.target);
        if (!link) return;
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0.01 }
  );
  map.forEach((_, sec) => io.observe(sec));
}

function initSearchClear() {
  const input = $('#searchInput');
  const clear = $('#searchClear');
  if (!input || !clear) return;
  const sync = () => {
    clear.hidden = !input.value;
  };
  input.addEventListener('input', sync);
  clear.addEventListener('click', () => {
    input.value = '';
    state.search = '';
    sync();
    renderCatalog();
    writeURLState();
    input.focus();
  });
  sync();
}

function gameFromHash() {
  const id = location.hash.replace(/^#/, '').trim();
  if (!id) return null;
  return games.find(g => g.id === id) || null;
}

function init() {
  if (typeof games === 'undefined' || !games.length) {
    console.error('GameVoice: data.js не загружен или пуст');
    return;
  }
  const savedTheme = LS.get('theme', null);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (systemDark ? 'dark' : 'light'));

  readURLState();
  const si0 = $('#searchInput');
  if (si0 && state.search) si0.value = state.search;

  on(
    $('#searchInput'),
    'input',
    debounce(e => {
      state.search = e.target.value;
