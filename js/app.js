/* GameVoice loader */
(async function(){
  try {
    const names = [0,1,2,3,4,5,6,7].map(i => 'js/c'+i+'.js');
    const parts = await Promise.all(names.map(n => fetch(n+'?v=20260925i').then(r=>{if(!r.ok)throw new Error(n+' '+r.status);return r.text()})));
    (0,eval)(parts.join(''));
  } catch(e) {
    console.error('GameVoice load failed', e);
    var el=document.getElementById('carousel');
    if(el) el.innerHTML='<div class="empty-state"><p>Ошибка загрузки. Ctrl+F5.</p></div>';
  }
})();
