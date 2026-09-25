      const cl = $('#searchClear');
      if (cl) cl.hidden = !e.target.value;
      renderCatalog();
      writeURLState();
    }, 150)
  );

  on($('#filterType'), 'change', e => {
    state.type = e.target.value;
    applyFiltersUI();
    renderCatalog();
    writeURLState();
  });
  on($('#filterStatus'), 'change', e => {
    state.status = e.target.value;
    renderCatalog();
    writeURLState();
  });
  on($('#filterPlatform'), 'change', e => {
    state.platform = e.target.value;
    renderCatalog();
    writeURLState();
  });
  on($('#sortBy'), 'change', e => {
    state.sort = e.target.value;
    LS.set('sort', state.sort);
    renderCatalog();
    writeURLState();
  });
  on($('#resetFilters'), 'click', resetFilters);

  $$('.view-toggle button').forEach(b =>
    b.addEventListener('click', () => setView(b.dataset.view))
  );
  $$('.view-toggle button').forEach(x =>
    x.classList.toggle('active', x.dataset.view === state.view)
  );

  on($('#themeBtn'), 'click', () => {
    applyTheme(
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    );
  });

  on($('#favBtn'), 'click', () => state.currentId && toggleFavorite(state.currentId));

  initChips();
  initCarouselNav();
  initModals();
  initChrome();
  initSearchClear();
  initScrollSpy();
  on($('#randomBtn'), 'click', pickRandomGame);
  bindTrailers();
  bindStarRating();
  bindVotes();
  bindLinks();
  bindShare();
  renderDrafts();
  renderStats();
  renderTop10();
  renderNews();

  applyFiltersUI();
  applyViewClass();
  renderCatalog();
  renderFavorites();
  writeURLState();

  const fromHash = gameFromHash();
  if (fromHash) {
    selectGame(fromHash.id, false);
    requestAnimationFrame(() => {
      if (location.hash) $('#details')?.scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    selectGame(games[0].id, false);
    startRotation();
  }

  window.addEventListener('hashchange', () => {
    const g = gameFromHash();
    if (g && g.id !== state.currentId) selectGame(g.id, false);
  });

  on($('#hero'), 'pointerenter', stopRotation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
