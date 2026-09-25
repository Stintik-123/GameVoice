/* GameVoice — split loader */
(async function () {
  try {
    const names = ['js/app_p1.js', 'js/app_p2.js', 'js/app_p3.js'];
    const parts = await Promise.all(names.map(n =>
      fetch(n + '?v=20260925g').then(r => {
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
