/* Local browsing preferences contain company slugs only. Quote details are never stored. */
(function () {
  'use strict';
  var saved = [];
  try { var value = JSON.parse(localStorage.getItem('roster-saved') || '[]'); if (Array.isArray(value)) saved = value.filter(function (s) { return typeof s === 'string'; }); } catch (e) {}
  var directory = document.querySelector('[data-directory]');
  var search = document.querySelector('[data-site-search]');
  var params = new URLSearchParams(location.search);
  function searchSite() {
    var query = search.value.trim();
    location.href = '/roster/search/' + (query ? '?q=' + encodeURIComponent(query) : '');
  }
  if (search) {
    search.value = params.get('q') || '';
    search.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); searchSite(); } });
    document.querySelector('[data-search-submit]').addEventListener('click', searchSite);
  }
  function updateSaved() {
    document.querySelectorAll('[data-save]').forEach(function (button) {
      var active = saved.includes(button.dataset.save);
      button.setAttribute('aria-pressed', String(active));
      var card = button.closest('[data-company]');
      button.setAttribute('aria-label', (active ? 'Unsave ' : 'Save ') + card.dataset.name);
      var label = button.querySelector('[data-save-label]');
      if (label) label.textContent = active ? 'Saved' : 'Save';
    });
    document.querySelectorAll('[data-saved-count]').forEach(function (counter) {
      counter.textContent = Array.from(document.querySelectorAll('[data-company]')).filter(function (card) { return saved.includes(card.dataset.slug); }).length;
    });
  }
  document.querySelectorAll('[data-save]').forEach(function (button) {
    button.addEventListener('click', function () {
      var slug = button.dataset.save;
      if (saved.includes(slug)) saved = saved.filter(function (s) { return s !== slug; }); else saved.push(slug);
      try { localStorage.setItem('roster-saved', JSON.stringify(saved)); } catch (e) {}
      updateSaved();
      if (directory) applyFilters();
    });
  });
  function applyFilters() {
    var query = directory.querySelector('[data-filter-search]').value.toLowerCase().trim();
    var filters = Array.from(directory.querySelectorAll('[data-filter]:checked')).map(function (el) { return el.dataset.filter; });
    var cards = Array.from(directory.querySelectorAll('[data-company]'));
    var activeLabel = directory.querySelector('[data-active-filters]');
    activeLabel.textContent = filters.length ? '(' + filters.length + ')' : '';
    var count = 0;
    cards.forEach(function (card) {
      var show = query.split(/\s+/).every(function (word) { return card.dataset.search.includes(word); }) && filters.every(function (filter) { return filter === 'saved' ? saved.includes(card.dataset.slug) : card.dataset[filter] === 'true'; });
      card.hidden = !show;
      if (show) count++;
    });
    directory.querySelector('[data-result-count]').textContent = count + ' of ' + cards.length + (cards.length === 1 ? ' company' : ' companies');
    directory.querySelector('[data-no-results]').hidden = count > 0;
    var sort = directory.querySelector('[data-sort]').value;
    cards.sort(function (a, b) { return sort === 'name' ? a.dataset.name.localeCompare(b.dataset.name) : Number(a.dataset.order) - Number(b.dataset.order); });
    cards.forEach(function (card) { directory.querySelector('.shortlist').appendChild(card); });
  }
  if (directory) {
    var toggle = directory.querySelector('[data-toggle-filters]');
    var filterContent = directory.querySelector('.filter-content');
    var mobile = window.matchMedia('(max-width:639px)');
    function setFilterVisibility(expanded) {
      filterContent.hidden = !expanded;
      toggle.setAttribute('aria-expanded', String(expanded));
    }
    setFilterVisibility(!mobile.matches);
    mobile.addEventListener('change', function () { setFilterVisibility(!mobile.matches); });
    toggle.addEventListener('click', function () { setFilterVisibility(filterContent.hidden); });
    var queryField = directory.querySelector('[data-filter-search]');
    queryField.value = params.get('q') || '';
    if (params.get('saved') === '1') directory.querySelector('[data-filter="saved"]').checked = true;
    directory.querySelectorAll('[data-filter], [data-sort]').forEach(function (el) { el.addEventListener('change', applyFilters); });
    queryField.addEventListener('input', applyFilters);
    directory.querySelectorAll('[data-reset]').forEach(function (button) {
      button.addEventListener('click', function () {
        queryField.value = '';
        directory.querySelectorAll('[data-filter]').forEach(function (input) { input.checked = false; });
        directory.querySelector('[data-sort]').value = 'recommended';
        if (search) search.value = '';
        history.replaceState(null, '', location.pathname);
        applyFilters();
        if (!filterContent.hidden) queryField.focus();
      });
    });
    applyFilters();
  }
  updateSaved();
})();
