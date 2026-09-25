/* GameVoice — split loader */
(async function () {
  try {
    const names = ['js/app_p1a.js','js/app_p1b.js','js/app_p2a.js','js/app_p2b.js','js/app_p3a.js','js/app_p3b.js'];
    const parts = await Promise.all(names.map(n =>
      fetch(n + '?v=20260925h').then(r => {
        if (!r.ok) throw new Error(n + ' ' + r.status);
        return r.text();
      })
    ));
    (0, eval)(parts.join(''));
  } catch (e) {
    console.error('GameVoice load failed', e);
    var el = document.getElementById('carousel');
    if (el) el.innerHTML = '<div class="empty-state"><p>Ошибка загрузки. Ctrl+F5.</p></div>';
  }
})();
