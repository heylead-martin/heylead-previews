// A local UI preview only. No requests, browser storage or contact-detail logging.
import {companyMatch} from './company-match.mjs?v=20261011';
(() => {
  const form = document.querySelector('[data-claim-preview]');
  if (!form) return;
  const company = form.querySelector('#claim-company');
  const result = document.querySelector('[data-claim-result]');
  const feedback = document.querySelector('#claim-company-match');
  const companies = [...document.querySelectorAll('#claim-companies option')].map(option => ({name:option.value,slug:option.dataset.slug}));
  const slug = new URLSearchParams(location.search).get('company');
  function matchCompany(complete=false) {
    const match = companyMatch(company.value,companies);
    if (match) {
      if (complete) company.value = match.name;
      feedback.textContent = 'Listing found: ' + match.name;
    } else {
      feedback.textContent = company.value.trim() ? 'Keep typing or choose a matching suggestion. You can also preview a request with a new business name.' : 'Start typing to find your listing, or enter your business name.';
    }
  }
  const initial = companyMatch(slug,companies);
  if (initial) { company.value = initial.name; matchCompany(); }
  company.addEventListener('input', () => matchCompany());
  company.addEventListener('change', () => matchCompany(true));
  company.addEventListener('blur', () => matchCompany(true));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    matchCompany(true);
    const selected = company.value;
    result.querySelector('[data-claim-business]').textContent = 'Business selected: ' + selected;
    form.reset();
    company.value = selected;
    form.hidden = true;
    result.hidden = false;
    result.focus();
  });
  document.querySelector('[data-claim-again]').addEventListener('click', () => {
    result.hidden = true;
    form.hidden = false;
    company.focus();
  });
  form.querySelector('fieldset').disabled = false;
})();
