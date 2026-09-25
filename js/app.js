/* GameVoice loader */
(async function(){
  try {
    const names = Array.from({length:16}, (_,i) => 'js/x'+i+'.js');
    const parts = await Promise.all(names.map(n => fetch(n+'?v=20260925k').then(r=>{if(!r.ok)throw new Error(n+' '+r.status);return r.text()})));
    (0,eval)(parts.join(''));
  } catch(e) {
    console.error('GameVoice load failed', e);
    var el=document.getElementById('carousel');
    if(el) el.innerHTML='<div class="empty-state"><p>Ошибка загрузки. Ctrl+F5.</p></div>';
  }
})();
