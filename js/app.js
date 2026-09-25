/* GameVoice — gunzip loader (split b64) */
(async function () {
  try {
    const parts = await Promise.all(
      ['js/app.b64a', 'js/app.b64b'].map(n =>
        fetch(n + '?v=20260925g').then(r => {
          if (!r.ok) throw new Error(n + ' ' + r.status);
          return r.text();
        })
      )
    );
    const b64 = parts.join('').trim();
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const text = await new Response(
      new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).text();
    (0, eval)(text);
  } catch (e) {
    console.error('GameVoice load failed', e);
    var el = document.getElementById('carousel');
    if (el) el.innerHTML = '<div class="empty-state"><p>Ошибка загрузки. Ctrl+F5.</p></div>';
  }
})();
