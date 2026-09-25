/* GameVoice — gunzip loader */
(async function () {
  try {
    const b64 = await fetch('js/app.b64?v=20260925g').then(r => {
      if (!r.ok) throw new Error('app.b64 ' + r.status);
      return r.text();
    });
    const bin = Uint8Array.from(atob(b64.trim()), c => c.charCodeAt(0));
    const text = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    (0, eval)(text);
  } catch (e) {
    console.error('GameVoice load failed', e);
    var el = document.getElementById('carousel');
    if (el) el.innerHTML = '<div class="empty-state"><p>Ошибка загрузки. Ctrl+F5.</p></div>';
  }
})();
