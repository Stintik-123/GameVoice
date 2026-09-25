      try {
        lastFocus.focus();
      } catch {}
    }
    lastFocus = null;
  }
}

function initModals() {
  on($('#addBtn'), 'click', () => openModal('#addModal'));
  on($('#faqBtn'), 'click', () => openModal('#faqModal'));
  $$('.modal').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-close]')) closeModal(m);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal.open').forEach(closeModal);
      closeMobileMenu();
    }
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName);

    if (e.key === '?' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const hm = $('#hotkeysModal');
      if (hm) {
        if (hm.classList.contains('open')) closeModal(hm);
        else openModal(hm);
      }
      return;
    }

    if (!typing && !$$('.modal.open').length && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'r') {
        e.preventDefault();
        pickRandomGame();
        return;
      }
      if (k === 'g') {
        e.preventDefault();
        setView('grid');
        return;
      }
      if (k === 'l') {
        e.preventDefault();
        setView('list');
        return;
      }
      if (k === 'c') {
        e.preventDefault();
        setView('carousel');
        return;
      }
    }

    if (e.key === '/' && !typing) {
      e.preventDefault();
      const si = $('#searchInput');
      if (si) {
        si.focus();
        si.select();
      }
    }
    if (
      !typing &&
      !$$('.modal.open').length &&
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
    ) {
      const list = filteredGames();
      if (!list.length) return;
      const idx = list.findIndex(g => g.id === state.currentId);
      const next =
        e.key === 'ArrowRight'
          ? list[(idx + 1) % list.length]
          : list[(idx - 1 + list.length) % list.length];
      if (next) {
        e.preventDefault();
        selectGame(next.id);
      }
    }
  });

  on($('#addForm'), 'submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const drafts = LS.get('drafts', []);
    drafts.push({ ...data, date: new Date().toISOString().slice(0, 10) });
    LS.set('drafts', drafts);
    closeModal($('#addModal'));
    e.target.reset();
    toast('Черновик сохранён локально. Спасибо!');
    renderDrafts();
