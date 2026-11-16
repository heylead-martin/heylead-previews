(function(){
  var t=document.querySelector('.nav-toggle'),n=document.getElementById('site-nav'),r=document.documentElement;
  function set(o){n.classList.toggle('open',o);r.classList.toggle('menu-open',o);t.setAttribute('aria-expanded',o);}
  if(t&&n){
    t.addEventListener('click',function(){set(!n.classList.contains('open'));});
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&n.classList.contains('open')){set(false);t.focus();}
    });
  }
  var m=document.querySelector('[data-map]');
  if(m){
    m.addEventListener('click',function(){
      var f=document.createElement('iframe');
      f.src=m.getAttribute('data-map');f.title='Карта: ул. „Средна гора“ 68, София';
      f.loading='lazy';f.referrerPolicy='no-referrer-when-downgrade';f.allowFullscreen=true;
      var ph=m.closest('.map-ph');ph.innerHTML='';ph.appendChild(f);
    });
  }
})();
