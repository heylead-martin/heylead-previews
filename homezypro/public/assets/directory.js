/* Shared directory search. Account and saved-list state lives in account-client.mjs. */
(function () {
  'use strict';
  var search=document.querySelector('[data-site-search]');
  var params=new URLSearchParams(location.search);
  function searchSite(){var query=search.value.trim();location.href='/search/'+(query?'?q='+encodeURIComponent(query):'');}
  if(search){search.value=params.get('q')||'';search.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();searchSite();}});document.querySelector('[data-search-submit]').addEventListener('click',searchSite);}
})();
