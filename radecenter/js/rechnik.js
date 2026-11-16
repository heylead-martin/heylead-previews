(function(){
  var q=document.getElementById('rx-q');if(!q)return;
  var rows=document.querySelectorAll('.rx tbody tr'),groups=document.querySelectorAll('.rx-group'),
      empty=document.querySelector('.rx-empty'),idx=document.querySelector('.rx-index'),t;
  function run(){
    var v=q.value.trim().toLowerCase(),any=false;
    for(var i=0;i<rows.length;i++){rows[i].hidden=v&&rows[i].getAttribute('data-q').indexOf(v)<0;}
    for(var j=0;j<groups.length;j++){
      var vis=groups[j].querySelector('tbody tr:not([hidden])');
      groups[j].hidden=!vis;if(vis)any=true;
    }
    empty.hidden=any;idx.hidden=!!v;
  }
  q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(run,120);});
})();
