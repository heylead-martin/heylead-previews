/* Profile interactions and image fallbacks. Accounts use accounts.js. */
(function () {
  'use strict';
  function logoFallback(image) { if (!image.matches('[data-company-logo]')) return; image.hidden = true; image.parentElement.classList.remove('has-logo'); image.parentElement.setAttribute('aria-label', 'Company initials placeholder'); }
  document.addEventListener('error', function (event) { if (event.target instanceof HTMLImageElement) logoFallback(event.target); }, true);
  document.querySelectorAll('[data-company-logo]').forEach(function (image) { if (image.complete && !image.naturalWidth) logoFallback(image); });
  var reviews = document.querySelector('[data-profile-reviews]');
  if (reviews) {
    var search = reviews.querySelector('[data-review-search]');
    if (search) {
      var entries = Array.from(reviews.querySelectorAll('[data-review-entry]'));
      function filterReviews() {
        var query = search.value.trim().toLowerCase();
        var count = 0;
        entries.forEach(function (entry) {
          var show = entry.textContent.toLowerCase().includes(query);
          entry.hidden = !show;
          if (show) count++;
        });
        reviews.querySelector('[data-review-empty]').hidden = count > 0;
        reviews.querySelector('[data-review-count]').textContent = count + ' of ' + entries.length + ' review excerpts shown';
      }
      search.addEventListener('input', filterReviews);
      reviews.querySelector('[data-clear-reviews]').addEventListener('click', function () { search.value = ''; filterReviews(); search.focus(); });
    }
  }
  var tabs = Array.from(document.querySelectorAll('.company-section-nav a'));
  if (tabs.length) {
    function setTab(id) { tabs.forEach(function (tab) { var active = tab.hash === '#' + id; tab.classList.toggle('is-active', active); if (active) tab.setAttribute('aria-current', 'location'); else tab.removeAttribute('aria-current'); }); }
    setTab(location.hash.slice(1) || 'pricing');
    tabs.forEach(function (tab) { tab.addEventListener('click', function () { setTab(tab.hash.slice(1)); }); });
    window.addEventListener('hashchange', function () { setTab(location.hash.slice(1) || 'pricing'); });
  }
})();
