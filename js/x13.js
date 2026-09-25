  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = !menu.hidden;
      menu.hidden = open;
      burger.setAttribute('aria-expanded', String(!open));
      burger.classList.toggle('open', !open);
    });
    menu.addEventListener('click', e => {
      if (e.target.closest('a')) closeMobileMenu();
    });
  }
  on($('#faqBtnMobile'), 'click', () => {
    closeMobileMenu();
    openModal('#faqModal');
  });
  on($('#addBtnMobile'), 'click', () => {
    closeMobileMenu();
    openModal('#addModal');
  });
  on($('#faqBtnFooter'), 'click', () => openModal('#faqModal'));
  on($('#footerFaqLink'), 'click', e => {
    e.preventDefault();
    openModal('#faqModal');
  });
  on($('#heroDots'), 'click', e => {
    const dot = e.target.closest('[data-dot]');
    if (dot) selectGame(dot.dataset.dot);
  });
  on($('#gotoDetailsBtn'), 'click', () => {
    $('#details')?.scrollIntoView({ behavior: 'smooth' });
  });
  const toTop = $('#toTop');
  if (toTop) {
    window.addEventListener(
      'scroll',
      () => toTop.classList.toggle('show', window.scrollY > 500),
      { passive: true }
    );
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }
}

function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

const _origRenderCatalog = renderCatalog;
renderCatalog = function () {
  _origRenderCatalog();
  renderTop10();
};


/* —— URL state (shareable filters) —— */
function readURLState() {
  const p = new URLSearchParams(location.search);
  if (p.has('q')) state.search = p.get('q') || '';
  if (p.has('type')) state.type = p.get('type') || 'all';
  if (p.has('status')) state.status = p.get('status') || 'all';
  if (p.has('platform')) state.platform = p.get('platform') || 'all';
  if (p.has('sort')) state.sort = p.get('sort') || state.sort;
  if (p.has('view')) state.view = p.get('view') || state.view;
}

function writeURLState() {
  const p = new URLSearchParams();
  if (state.search.trim()) p.set('q', state.search.trim());
  if (state.type !== 'all') p.set('type', state.type);
  if (state.status !== 'all') p.set('status', state.status);
  if (state.platform !== 'all') p.set('platform', state.platform);
  if (state.sort !== 'rating') p.set('sort', state.sort);
  if (state.view !== 'grid') p.set('view', state.view);
  const qs = p.toString();
  const hash = location.hash || '';
  const next = location.pathname + (qs ? '?' + qs : '') + hash;
